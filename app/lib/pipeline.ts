/**
 * Call processing pipeline orchestrator
 * Coordinates: chunking → signal extraction → aggregation
 *
 * COST: ~$0.0015 per 5-min call (gpt-4o-mini only)
 */

import { prisma } from "@/app/lib/prisma";
import { chunkTranscript } from "./chunker";
import { extractSignalsBatch } from "./signals";
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

    // Step 2: Extract signals (gpt-4o-mini, costs money)
    console.log(`[${callId}] Extracting signals...`);
    const signals = await extractSignalsBatch(chunks);

    console.log(`[${callId}] Extracted ${signals.length} signals`);

    // Step 3: Persist signals
    await prisma.callSignal.createMany({
      data: signals.map((signal, index) => ({
        callId,
        chunkIndex: Math.floor(signal.startTime / 75), // Estimate chunk from time
        signalType: signal.type,
        signalData: signal.data,
        confidence: signal.confidence,
        startTime: signal.startTime,
        endTime: signal.endTime,
      })),
    });

    // Update status to aggregating
    await prisma.call.update({
      where: { id: callId },
      data: { status: "aggregating" },
    });

    // Step 4: Aggregate signals (pure computation, $0)
    console.log(`[${callId}] Aggregating signals...`);
    const aggregates = aggregateSignals(
      signals,
      transcript.durationSeconds || 180
    );

    // Step 5: Persist aggregates
    await prisma.callAggregate.create({
      data: {
        callId,
        features: aggregates as any,
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
      signalCount: signals.length,
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
