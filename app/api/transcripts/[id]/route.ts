import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

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

    // Fetch transcript
    const transcript = await prisma.transcript.findFirst({
      where: { id, userId: session.user.id },
      include: {
        calls: {
          select: {
            id: true,
            outcome: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transcript);
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}

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

    // Check if transcript exists
    const transcript = await prisma.transcript.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    // Delete transcript (cascades to calls, signals, aggregates)
    await prisma.transcript.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Transcript deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting transcript:", error);
    return NextResponse.json(
      { error: "Failed to delete transcript" },
      { status: 500 }
    );
  }
}
