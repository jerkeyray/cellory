/**
 * Call processing pipeline orchestrator
 * Coordinates: chunking → signal extraction → aggregation
 *
 * COST: ~$0.0015 per 5-min call (gpt-4o-mini only)
 */

import { prisma } from "@/app/lib/prisma";
import { chunkTranscript } from "./chunker";
import { extractMarkersBatch, mergeExtractionResults } from "./signals-v2";
import { aggregateSignals } from "./aggregator";

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

    // Step 2: Extract agent-trainable markers (gpt-4o-mini, costs money)
    console.log(`[${callId}] Extracting markers...`);
    const extractionResults = await extractMarkersBatch(chunks);
    const merged = mergeExtractionResults(extractionResults);

    console.log(`[${callId}] Extracted ${merged.agent_markers.length} markers`);
    console.log(`[${callId}] Predicted outcome: ${merged.auxiliary_metrics.predicted_outcome || "unknown"}`);

    // Auto-set outcome from AI prediction
    const predictedOutcome = merged.auxiliary_metrics.predicted_outcome;
    if (predictedOutcome) {
      await prisma.call.update({
        where: { id: callId },
        data: { outcome: predictedOutcome },
      });
    }

    // Step 3: Persist markers
    await prisma.callSignal.createMany({
      data: merged.agent_markers.map((marker) => ({
        callId,
        chunkIndex: Math.floor(marker.startTime / 75),
        signalType: marker.type,
        signalData: marker as any, // Store full marker object
        confidence: marker.confidence,
        startTime: marker.startTime,
        endTime: marker.endTime,
      })),
    });

    // Store auxiliary metrics in call aggregate
    const auxiliaryMetrics = merged.auxiliary_metrics;

    // Update status to aggregating
    await prisma.call.update({
      where: { id: callId },
      data: { status: "aggregating" },
    });

    // Step 4: Aggregate markers (pure computation, $0)
    console.log(`[${callId}] Aggregating markers...`);
    const aggregates = aggregateSignals(
      merged.agent_markers.map(m => ({
        type: m.type,
        confidence: m.confidence,
        startTime: m.startTime,
        endTime: m.endTime,
        data: m as any,
      })) as any,
      transcript.durationSeconds || 180
    );

    // Step 5: Persist aggregates + auxiliary metrics
    await prisma.callAggregate.create({
      data: {
        callId,
        features: {
          ...aggregates,
          auxiliary_metrics: auxiliaryMetrics,
        } as any,
      },
    });

    // Update status to complete
    await prisma.call.update({
      where: { id: callId },
      data: { status: "complete" },
    });

    console.log(`[${callId}] Pipeline complete!`);

    return {
      callId,
      status: "complete",
      signalCount: merged.agent_markers.length,
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
