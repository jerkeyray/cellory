import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Get a specific playbook
 * GET /api/playbooks/[id]
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
    const playbook = await prisma.playbook.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(playbook);
  } catch (error) {
    console.error("Error fetching playbook:", error);
    return NextResponse.json(
      { error: "Failed to fetch playbook" },
      { status: 500 }
    );
  }
}

/**
 * Update a playbook
 * PUT /api/playbooks/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, content } = await request.json();

    const playbook = await prisma.playbook.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.playbook.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating playbook:", error);
    return NextResponse.json(
      { error: "Failed to update playbook" },
      { status: 500 }
    );
  }
}

/**
 * Delete a playbook
 * DELETE /api/playbooks/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const playbook = await prisma.playbook.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: "Playbook not found" },
        { status: 404 }
      );
    }

    await prisma.playbook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting playbook:", error);
    return NextResponse.json(
      { error: "Failed to delete playbook" },
      { status: 500 }
    );
  }
}
