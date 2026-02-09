import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Add a tag to a call
 * POST /api/calls/[id]/tags
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
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Tag name is required" },
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

    // Check if tag already exists for this call
    const existingTag = await prisma.callTag.findFirst({
      where: {
        callId: id,
        name,
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag already exists for this call" },
        { status: 409 }
      );
    }

    // Create tag
    const tag = await prisma.callTag.create({
      data: {
        callId: id,
        name,
        color: color || generateRandomColor(),
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

/**
 * Get all tags for a call
 * GET /api/calls/[id]/tags
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
    const tags = await prisma.callTag.findMany({
      where: { callId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

/**
 * Generate a random color for tags
 */
function generateRandomColor(): string {
  const colors = [
    "#ef4444", // red
    "#f59e0b", // amber
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
