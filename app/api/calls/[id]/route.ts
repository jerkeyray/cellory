import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { invalidateComparisonCache } from "@/app/lib/comparison-cache";

/**
 * GET /api/calls/[id]
 * Get call details with signals and aggregates
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch call with all related data
    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        transcript: {
          select: {
            id: true,
            filename: true,
            content: true,
            durationSeconds: true,
            language: true,
            createdAt: true,
          },
        },
        signals: {
          orderBy: {
            startTime: "asc",
          },
        },
        aggregates: {
          orderBy: {
            computedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    return NextResponse.json(
      { error: "Failed to fetch call" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calls/[id]
 * Delete a call and its associated signals and aggregates
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if call exists
    const call = await prisma.call.findUnique({
      where: { id },
    });

    if (!call) {
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // Delete call (cascades to signals and aggregates)
    await prisma.call.delete({
      where: { id },
    });

    // Invalidate comparison cache since call data changed
    invalidateComparisonCache();

    return NextResponse.json({
      message: "Call deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting call:", error);
    return NextResponse.json(
      { error: "Failed to delete call" },
      { status: 500 }
    );
  }
}
