import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/**
 * Add a tag to a call
 * POST /api/calls/[id]/tags
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Tag name is required" },
        { status: 400 }
      );
    }

    // Check if call exists
    const call = await prisma.call.findUnique({
      where: { id: params.id },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // Check if tag already exists for this call
    const existingTag = await prisma.callTag.findFirst({
      where: {
        callId: params.id,
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
        callId: params.id,
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
  { params }: { params: { id: string } }
) {
  try {
    const tags = await prisma.callTag.findMany({
      where: { callId: params.id },
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
