import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch processing

/**
 * Batch analyze multiple transcripts
 * POST /api/calls/batch
 * Body: { transcriptIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcriptIds } = await request.json();

    if (!transcriptIds || !Array.isArray(transcriptIds) || transcriptIds.length === 0) {
      return NextResponse.json(
        { error: "transcriptIds array is required" },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeout
    if (transcriptIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 transcripts can be analyzed at once" },
        { status: 400 }
      );
    }

    // Verify all transcripts exist and are ready
    const transcripts = await prisma.transcript.findMany({
      where: {
        id: { in: transcriptIds },
        userId: session.user.id,
        status: "ready", // Only process ready transcripts
      },
      select: {
        id: true,
        content: true,
        _count: {
          select: { calls: true },
        },
      },
    });

    if (transcripts.length === 0) {
      return NextResponse.json(
        { error: "No valid transcripts found" },
        { status: 404 }
      );
    }

    // Filter out already analyzed transcripts
    const unanalyzedTranscripts = transcripts.filter(
      (t) => t._count.calls === 0
    );

    if (unanalyzedTranscripts.length === 0) {
      return NextResponse.json(
        { error: "All selected transcripts are already analyzed" },
        { status: 400 }
      );
    }

    // Create call records for batch processing
    const calls = await Promise.all(
      unanalyzedTranscripts.map(async (transcript) => {
        return await prisma.call.create({
          data: {
            userId: session.user.id,
            transcriptId: transcript.id,
            outcome: "success", // Default, will be updated by processing
            status: "pending",
          },
        });
      })
    );

    // Start async processing for all calls (don't await)
    processBatchCalls(calls.map((c) => c.id));

    return NextResponse.json(
      {
        message: "Batch analysis started",
        count: calls.length,
        callIds: calls.map((c) => c.id),
      },
      { status: 202 } // Accepted for processing
    );
  } catch (error) {
    console.error("Batch analysis error:", error);
    return NextResponse.json(
      { error: "Failed to start batch analysis" },
      { status: 500 }
    );
  }
}

/**
 * Process multiple calls asynchronously
 * This runs in the background after the API response
 */
async function processBatchCalls(callIds: string[]) {
  // Import the pipeline processor
  const { processCallAsync } = await import("@/app/lib/pipeline");

  // Process calls in parallel (with concurrency limit to avoid overwhelming the system)
  const CONCURRENCY = 3; // Process 3 at a time (each takes ~30s)
  const results = [];

  for (let i = 0; i < callIds.length; i += CONCURRENCY) {
    const batch = callIds.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((callId) => processCallAsync(callId))
    );
    results.push(...batchResults);
  }

  // Log summary
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(
    `Batch processing complete: ${successful} succeeded, ${failed} failed out of ${callIds.length} total`
  );
}
