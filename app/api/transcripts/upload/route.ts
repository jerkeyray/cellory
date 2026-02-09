import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { transcribeAudio, validateAudioFile } from "@/app/lib/whisper";
import {
  addSpeakerLabels,
  addSpeakerLabelsStructured,
} from "@/app/lib/diarization";
import { extractAudioMetadata } from "@/app/lib/audio-metadata";
import { computeQualityScore } from "@/app/lib/audio-quality";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type. Expected multipart/form-data." },
        { status: 415 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error("Failed to parse form data:", parseError);
      return NextResponse.json(
        { error: "Failed to parse form data" },
        { status: 400 }
      );
    }
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
        userId: session.user.id,
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
    // Step 1: Extract audio metadata (zero cost)
    console.log(`[${transcriptId}] Extracting audio metadata...`);
    const audioMetadata = await extractAudioMetadata(file);

    // Step 2: Transcribe audio (captures segments now)
    console.log(`[${transcriptId}] Transcribing audio...`);
    const result = await transcribeAudio(file);

    // Step 3: Compute quality score (zero cost, pure computation)
    console.log(`[${transcriptId}] Computing quality score...`);
    const qualityScore = computeQualityScore(
      result.segments || [],
      audioMetadata,
      result.duration
    );

    // Step 4: Add speaker labels for content string (existing)
    console.log(`[${transcriptId}] Adding speaker labels...`);
    const labeledTranscript = await addSpeakerLabels(result.text);

    // Step 5: Add structured speaker labels with timestamps (new)
    console.log(`[${transcriptId}] Creating structured diarization...`);
    const diarizationSegments = await addSpeakerLabelsStructured(
      result.text,
      result.wordTimestamps || []
    );

    // Count unique speakers
    const speakerCount = new Set(
      diarizationSegments.map((s) => s.speaker)
    ).size;

    // Calculate word count
    const wordCount = labeledTranscript
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // Step 6: Update transcript with all results
    console.log(`[${transcriptId}] Persisting results...`);
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: {
        content: labeledTranscript,
        durationSeconds: Math.round(result.duration),
        wordTimestamps: result.wordTimestamps || [],
        language: result.language,
        wordCount: wordCount,

        // Audio metadata
        audioFormat: audioMetadata.format,
        audioSampleRate: audioMetadata.sampleRate,
        audioChannels: audioMetadata.channels,
        audioBitrate: audioMetadata.bitrate,

        // Whisper segments and quality
        whisperSegments: (result.segments?.map((segment) => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          avg_logprob: segment.avg_logprob,
          compression_ratio: segment.compression_ratio,
          no_speech_prob: segment.no_speech_prob,
        })) || []) as any,
        avgConfidence: qualityScore.confidence,
        speechRatio: qualityScore.speechRatio,
        languageConfidence: null, // Whisper doesn't provide this in current API
        qualityScore: qualityScore.overall,

        // Structured diarization
        diarizationSegments: diarizationSegments as any,
        speakerCount: speakerCount,

        status: "ready",
      },
    });

    console.log(`[${transcriptId}] Transcription completed!`);
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
