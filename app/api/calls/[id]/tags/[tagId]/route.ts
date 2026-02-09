import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Delete a tag from a call
 * DELETE /api/calls/[id]/tags/[tagId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    // Check if tag exists
    const tag = await prisma.callTag.findUnique({
      where: { id: params.tagId },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Verify tag belongs to the call
    if (tag.callId !== params.id) {
      return NextResponse.json(
        { error: "Tag does not belong to this call" },
        { status: 403 }
      );
    }

    // Delete tag
    await prisma.callTag.delete({
      where: { id: params.tagId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
