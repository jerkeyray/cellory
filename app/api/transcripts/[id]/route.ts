import { NextRequest, NextResponse } from "next/server";
import { safeAuth } from "@/app/lib/safe-auth";
import { prisma } from "@/app/lib/prisma";
import {
  buildCsvExport,
  buildCsvExportFromTranscriptContent,
  buildMarkdownExport,
  buildNormalizedTranscriptExport,
} from "@/app/lib/transcript-import";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await safeAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format");

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

    if (format === "normalized") {
      if (!Array.isArray(transcript.importedSegments)) {
        return NextResponse.json(
          { error: "Normalized export is only available for imported transcripts" },
          { status: 400 }
        );
      }
      const normalized = buildNormalizedTranscriptExport({
        id: transcript.id,
        userId: transcript.userId,
        source: transcript.source,
        importMetadata: transcript.importMetadata,
        importedSegments: transcript.importedSegments,
      });

      return NextResponse.json(normalized);
    }

    if (format === "markdown") {
      if (!Array.isArray(transcript.importedSegments)) {
        return NextResponse.json(
          { error: "Markdown export is only available for imported transcripts" },
          { status: 400 }
        );
      }
      const normalized = buildNormalizedTranscriptExport({
        id: transcript.id,
        userId: transcript.userId,
        source: transcript.source,
        importMetadata: transcript.importMetadata,
        importedSegments: transcript.importedSegments,
      });
      const markdown = buildMarkdownExport(normalized);
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${transcript.filename.replace(/\.[^/.]+$/, "")}.md"`,
        },
      });
    }

    if (format === "csv") {
      const csv = Array.isArray(transcript.importedSegments)
        ? buildCsvExport(
            buildNormalizedTranscriptExport({
              id: transcript.id,
              userId: transcript.userId,
              source: transcript.source,
              importMetadata: transcript.importMetadata,
              importedSegments: transcript.importedSegments,
            })
          )
        : buildCsvExportFromTranscriptContent(
            transcript.content || "",
            transcript.durationSeconds
          );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${transcript.filename.replace(/\.[^/.]+$/, "")}.csv"`,
        },
      });
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
    const session = await safeAuth();
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
