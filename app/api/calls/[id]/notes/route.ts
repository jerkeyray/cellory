import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Create a note for a call
 * POST /api/calls/[id]/notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Check if call exists
    const call = await prisma.call.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // Create note
    const note = await prisma.callNote.create({
      data: {
        callId: id,
        content: content.trim(),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}

/**
 * Get all notes for a call
 * GET /api/calls/[id]/notes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const call = await prisma.call.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }
    const notes = await prisma.callNote.findMany({
      where: { callId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
