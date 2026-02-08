import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { processCallAsync } from "@/app/lib/pipeline";

/**
 * GET /api/calls
 * List all calls with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const outcome = searchParams.get("outcome") as "success" | "failure" | null;

    // Build filter
    const where: any = {};
    if (outcome) {
      where.outcome = outcome;
    }

    // Fetch calls
    const calls = await prisma.call.findMany({
      where,
      select: {
        id: true,
        outcome: true,
        status: true,
        createdAt: true,
        transcript: {
          select: {
            filename: true,
            durationSeconds: true,
          },
        },
        _count: {
          select: {
            signals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calls
 * Create a new call and start processing
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { transcriptId } = body;

    // Validate
    if (!transcriptId) {
      return NextResponse.json(
        { error: "Missing transcriptId" },
        { status: 400 }
      );
    }

    // Check if transcript exists and is ready
    const transcript = await prisma.transcript.findUnique({
      where: { id: transcriptId },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    if (transcript.status !== "ready") {
      return NextResponse.json(
        { error: "Transcript is not ready for analysis" },
        { status: 400 }
      );
    }

    // Create call with placeholder outcome (will be auto-determined)
    const call = await prisma.call.create({
      data: {
        transcriptId,
        outcome: "success", // Placeholder, will be updated by AI
        status: "pending",
      },
    });

    // Start processing asynchronously (don't await)
    processCallAsync(call.id);

    return NextResponse.json(
      {
        id: call.id,
        transcriptId: call.transcriptId,
        outcome: call.outcome,
        status: call.status,
        message: "Call created. Processing started.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating call:", error);
    return NextResponse.json(
      { error: "Failed to create call" },
      { status: 500 }
    );
  }
}
