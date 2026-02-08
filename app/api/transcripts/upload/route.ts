import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { transcribeAudio, validateAudioFile } from "@/app/lib/whisper";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // COST WARNING: Each upload triggers Whisper API call (~$0.006/min)
    // For demo: use short audio files only
    // For production: import pre-transcribed text instead

    // Create transcript record with processing status
    const transcript = await prisma.transcript.create({
      data: {
        filename: file.name,
        content: "", // Will be filled after transcription
        status: "processing",
      },
    });

    // Start transcription asynchronously (don't await here for faster response)
    processTranscription(transcript.id, file);

    return NextResponse.json(
      {
        id: transcript.id,
        filename: transcript.filename,
        status: transcript.status,
        message: "Upload successful. Transcription in progress.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * Process transcription asynchronously
 */
async function processTranscription(transcriptId: string, file: File) {
  try {
    // Transcribe audio
    const result = await transcribeAudio(file);

    // Update transcript with results
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        content: result.text,
        durationSeconds: Math.round(result.duration),
        wordTimestamps: result.wordTimestamps || [],
        language: result.language,
        status: "ready",
      },
    });

    console.log(`Transcription completed for ${transcriptId}`);
  } catch (error) {
    console.error(`Transcription failed for ${transcriptId}:`, error);

    // Update status to error
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        status: "error",
      },
    });
  }
}
