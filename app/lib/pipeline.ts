/**
 * Call processing pipeline orchestrator
 * Coordinates: chunking → signal extraction → aggregation
 *
 * COST: ~$0.0015 per 5-min call (gpt-4o-mini only)
 */

import { prisma } from "@/app/lib/prisma";
import { chunkTranscript } from "./chunker";
import { extractMarkersBatchV3, mergeExtractionResultsV3 } from "./signals-v3";
import { aggregateSignalsV3 } from "./aggregator-v3";
import { invalidateComparisonCache } from "./comparison-cache";
import { sendToBackboard } from "./backboard";

export interface PipelineResult {
  callId: string;
  status: "complete" | "error";
  signalCount: number;
  error?: string;
}

/**
 * Process a call through the full intelligence pipeline
 * Single entry point for call analysis
 */
export async function processCall(callId: string): Promise<PipelineResult> {
  try {
    // Update status to extracting
    await prisma.call.update({
      where: { id: callId },
      data: { status: "extracting" },
    });

    // Fetch call and transcript
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        transcript: true,
      },
    });

    if (!call || !call.transcript) {
      throw new Error("Call or transcript not found");
    }

    const { transcript } = call;

    if (transcript.status !== "ready") {
      throw new Error("Transcript not ready for processing");
    }

    // Step 1: Chunk transcript (pure computation, $0)
    console.log(`[${callId}] Chunking transcript...`);
    const chunks = chunkTranscript(
      transcript.content,
      transcript.wordTimestamps as any,
      transcript.durationSeconds
    );

    console.log(`[${callId}] Created ${chunks.length} chunks`);

    // Step 2: Extract decision-grade markers (gpt-4o-mini, costs money)
    console.log(`[${callId}] Extracting v3 markers...`);
    const extractionResults = await extractMarkersBatchV3(chunks);
    const merged = mergeExtractionResultsV3(extractionResults);

    console.log(`[${callId}] Extracted ${merged.markers.length} markers`);
    console.log(`[${callId}] Predicted outcome: ${merged.auxiliary_metrics.predicted_outcome || "unknown"}`);

    // Auto-set outcome from AI prediction
    const predictedOutcome = merged.auxiliary_metrics.predicted_outcome;
    if (predictedOutcome) {
      await prisma.call.update({
        where: { id: callId },
        data: { outcome: predictedOutcome },
      });
    }

    // Step 3: Persist markers (single time field maps to both startTime/endTime for DB compat)
    await prisma.callSignal.createMany({
      data: merged.markers.map((marker) => ({
        callId,
        chunkIndex: Math.floor(marker.time / 75),
        signalType: marker.type,
        signalData: marker as any,
        confidence: marker.confidence,
        startTime: marker.time,
        endTime: marker.time,
      })),
    });

    // Store auxiliary metrics
    const auxiliaryMetrics = merged.auxiliary_metrics;

    // Update status to aggregating
    await prisma.call.update({
      where: { id: callId },
      data: { status: "aggregating" },
    });

    // Step 4: Aggregate markers (pure computation, $0)
    console.log(`[${callId}] Aggregating v3 markers...`);
    const aggregates = aggregateSignalsV3(merged.markers, {
      predicted_outcome: auxiliaryMetrics.predicted_outcome,
      outcome_confidence: auxiliaryMetrics.outcome_confidence,
      call_tone: auxiliaryMetrics.call_tone,
    });

    // Step 5: Persist aggregates with schemaVersion: 3
    await prisma.callAggregate.create({
      data: {
        callId,
        features: aggregates as any,
      },
    });

    // Step 6: Send to Backboard for cross-call memory (non-blocking)
    try {
      const backboardThreadId = await sendToBackboard(
        callId,
        predictedOutcome || 'unknown',
        merged.markers,
        aggregates,
        transcript.content
      );

      // Store thread ID on Call record if successful
      if (backboardThreadId) {
        await prisma.call.update({
          where: { id: callId },
          data: { backboardThreadId },
        });
        console.log(`[${callId}] Stored Backboard thread ID: ${backboardThreadId}`);
      }
    } catch (error) {
      // Non-blocking — don't fail pipeline on Backboard errors
      console.error(`[${callId}] Backboard integration failed:`, error);
    }

    // Update status to complete
    await prisma.call.update({
      where: { id: callId },
      data: { status: "complete" },
    });

    // Invalidate comparison cache since we have new completed call data
    invalidateComparisonCache();

    console.log(`[${callId}] Pipeline complete!`);

    return {
      callId,
      status: "complete",
      signalCount: merged.markers.length,
    };
  } catch (error) {
    console.error(`[${callId}] Pipeline error:`, error);

    // Update status to error
    await prisma.call.update({
      where: { id: callId },
      data: { status: "error" },
    });

    return {
      callId,
      status: "error",
      signalCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process call asynchronously (non-blocking)
 * Returns immediately, processing happens in background
 */
export async function processCallAsync(callId: string): Promise<void> {
  // Fire and forget
  processCall(callId).catch((error) => {
    console.error(`Background processing error for ${callId}:`, error);
  });
}
