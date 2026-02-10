import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import {
  normalizedTranscriptSchema,
  parseSpeakerSentenceCsv,
  parseSanitizedMarkdownTranscript,
  prepareImportedTranscript,
} from "@/app/lib/transcript-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else if (contentType.includes("text/csv")) {
      const csv = await request.text();
      const segments = parseSpeakerSentenceCsv(csv);
      payload = {
        transcriptId: `import-${Date.now()}`,
        segments,
        metadata: { format: "speaker_sentence_csv" },
        source: "imported_csv",
      };
    } else if (contentType.includes("text/markdown") || contentType.includes("text/plain")) {
      const markdown = await request.text();
      const segments = parseSanitizedMarkdownTranscript(markdown);
      payload = {
        transcriptId: `import-${Date.now()}`,
        segments,
        metadata: { format: "sanitized_markdown" },
        source: "imported_markdown",
      };
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use application/json, text/csv, or text/markdown." },
        { status: 415 }
      );
    }

    const normalized = normalizedTranscriptSchema.parse(payload);
    const prepared = prepareImportedTranscript(normalized, {
      defaultSource: "imported_normalized",
    });

    const transcript = await prisma.transcript.create({
      data: {
        userId: session.user.id,
        filename: `${prepared.transcriptId}.imported.json`,
        content: prepared.content,
        source: prepared.source,
        importedSegments: prepared.segments as any,
        importMetadata: prepared.metadata as any,
        skipTranscription: true,
        status: "ready",
        durationSeconds: prepared.durationSeconds,
        wordTimestamps: prepared.wordTimestamps as any,
        language: typeof prepared.metadata.language === "string" ? prepared.metadata.language : null,
        wordCount: prepared.wordCount,
        avgConfidence: prepared.avgConfidence,
        diarizationSegments: prepared.diarizationSegments as any,
        speakerCount: prepared.speakerCount,
        qualityScore: null,
      },
    });

    return NextResponse.json(
      {
        id: transcript.id,
        filename: transcript.filename,
        status: transcript.status,
        source: transcript.source,
        skipTranscription: transcript.skipTranscription,
        message: "Transcript imported. Call analysis ready - markers are being extracted.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Transcript import error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import transcript";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
