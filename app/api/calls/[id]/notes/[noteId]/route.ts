import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Update a note
 * PUT /api/calls/[id]/notes/[noteId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    // Check if note exists
    const note = await prisma.callNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify note belongs to the call
    if (note.callId !== id) {
      return NextResponse.json(
        { error: "Note does not belong to this call" },
        { status: 403 }
      );
    }

    // Update note
    const updatedNote = await prisma.callNote.update({
      where: { id: noteId },
      data: { content: content.trim() },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

/**
 * Delete a note
 * DELETE /api/calls/[id]/notes/[noteId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;

    // Check if note exists
    const note = await prisma.callNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify note belongs to the call
    if (note.callId !== id) {
      return NextResponse.json(
        { error: "Note does not belong to this call" },
        { status: 403 }
      );
    }

    // Delete note
    await prisma.callNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
