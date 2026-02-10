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
import {
  extractNLUMarkersBatch,
  mergeNLUResults,
} from "./nlu-extraction";

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

    // Step 2: Extract decision-grade markers & NLU markers in parallel (gpt-4o-mini, costs money)
    console.log(`[${callId}] Extracting v3 markers and NLU markers in parallel...`);
    const [extractionResults, nluResults] = await Promise.all([
      extractMarkersBatchV3(chunks),
      extractNLUMarkersBatch(chunks),
    ]);

    const merged = mergeExtractionResultsV3(extractionResults);
    const mergedNLU = mergeNLUResults(nluResults);

    console.log(`[${callId}] Extracted ${merged.markers.length} markers`);
    console.log(`[${callId}] Predicted outcome: ${merged.auxiliary_metrics.predicted_outcome || "unknown"}`);

    // Auto-set outcome from AI prediction (non-blocking, don't fail pipeline if update fails)
    const predictedOutcome = merged.auxiliary_metrics.predicted_outcome;
    if (predictedOutcome) {
      try {
        await prisma.call.update({
          where: { id: callId },
          data: { outcome: predictedOutcome },
        });
      } catch (error) {
        console.error(`[${callId}] Failed to update predicted outcome:`, error);
      }
    }

    console.log(
      `[${callId}] Extracted NLU: ${mergedNLU.intents.length} intents, ` +
        `${mergedNLU.obligations.length} obligations, ` +
        `${mergedNLU.regulatory_phrases.length} regulatory, ` +
        `${mergedNLU.entities.length} entities`
    );

    // Step 3: Prepare all signals (v3 + NLU) for single batch persist
    const allSignals: any[] = [];

    // Add v3 markers
    merged.markers.forEach((marker) => {
      allSignals.push({
        callId,
        chunkIndex: Math.floor(marker.time / 75),
        signalType: marker.type,
        signalData: marker as any,
        confidence: marker.confidence,
        startTime: marker.time,
        endTime: marker.time,
      });
    });

    // Add NLU intents
    mergedNLU.intents.forEach((intent) => {
      allSignals.push({
        callId,
        chunkIndex: Math.floor(intent.time / 75),
        signalType: "intent_classification",
        signalData: intent,
        confidence: intent.confidence,
        startTime: intent.time,
        endTime: intent.time,
      });
    });

    // Add NLU obligations
    mergedNLU.obligations.forEach((obligation) => {
      allSignals.push({
        callId,
        chunkIndex: Math.floor(obligation.time / 75),
        signalType: "obligation_detection",
        signalData: obligation,
        confidence: obligation.confidence,
        startTime: obligation.time,
        endTime: obligation.time,
      });
    });

    // Add NLU regulatory phrases
    mergedNLU.regulatory_phrases.forEach((phrase) => {
      allSignals.push({
        callId,
        chunkIndex: 0, // Regulatory phrases are call-level
        signalType: "regulatory_phrase",
        signalData: phrase,
        confidence: phrase.confidence,
        startTime: phrase.time || 0,
        endTime: phrase.time || 0,
      });
    });

    // Add NLU entities
    mergedNLU.entities.forEach((entity) => {
      allSignals.push({
        callId,
        chunkIndex: Math.floor(entity.time / 75),
        signalType: "entity_mention",
        signalData: entity,
        confidence: entity.confidence,
        startTime: entity.time,
        endTime: entity.time,
      });
    });

    // Persist all signals in single batch (v3 + NLU combined)
    if (allSignals.length > 0) {
      await prisma.callSignal.createMany({
        data: allSignals,
      });
      console.log(`[${callId}] Persisted ${allSignals.length} total signals (v3 + NLU)`);
    }

    // Store merged NLU on transcript for quick access
    await prisma.transcript.update({
      where: { id: call.transcriptId },
      data: { nluResults: mergedNLU as any },
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
    const aggregates = aggregateSignalsV3(
      merged.markers,
      {
        predicted_outcome: auxiliaryMetrics.predicted_outcome,
        outcome_confidence: auxiliaryMetrics.outcome_confidence,
        call_tone: auxiliaryMetrics.call_tone,
      },
      mergedNLU
    );

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

      // Store thread ID on Call record if successful (non-blocking)
      if (backboardThreadId) {
        try {
          await prisma.call.update({
            where: { id: callId },
            data: {
              backboardThreadId,
              backboardError: null, // Clear any previous error
              backboardErrorAt: null,
            },
          });
          console.log(`[${callId}] Stored Backboard thread ID: ${backboardThreadId}`);
        } catch (error) {
          console.error(`[${callId}] Failed to store Backboard thread ID:`, error);
        }
      }
    } catch (error) {
      // Non-blocking — don't fail pipeline on Backboard errors
      const errorMessage = error instanceof Error ? error.message : "Unknown Backboard error";
      console.error(`[${callId}] Backboard integration failed:`, error);

      // Store error details for debugging and potential retry
      try {
        await prisma.call.update({
          where: { id: callId },
          data: {
            backboardError: errorMessage,
            backboardErrorAt: new Date(),
          },
        });
        console.log(`[${callId}] Stored Backboard error details for future retry`);
      } catch (updateError) {
        console.error(`[${callId}] Failed to store Backboard error:`, updateError);
      }
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

    // Update status to error (critical - wrap in try-catch to ensure we always return)
    try {
      await prisma.call.update({
        where: { id: callId },
        data: { status: "error" },
      });
    } catch (updateError) {
      console.error(`[${callId}] CRITICAL: Failed to update status to error:`, updateError);
      // Even if status update fails, continue to return error result
    }

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
