import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Get all unique tag names with usage counts
 * GET /api/tags
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tags grouped by name
    const tags = await prisma.callTag.groupBy({
      by: ["name", "color"],
      _count: { name: true },
      where: {
        call: {
          userId: session.user.id,
        },
      },
      orderBy: { _count: { name: "desc" } },
    });

    // Format response
    const uniqueTags = tags.map((tag) => ({
      name: tag.name,
      color: tag.color,
      count: tag._count.name,
    }));

    return NextResponse.json(uniqueTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
