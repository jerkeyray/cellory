/**
 * Whisper transcription utility
 *
 * COST WARNING:
 * - Whisper pricing: ~$0.006 per minute of audio
 * - Use ONLY for demo/development transcripts
 * - For production: transcribe offline, import text directly
 * - Budget: $5 total → ~800 minutes max (but we need budget for LLM calls!)
 *
 * RECOMMENDATION: Use pre-transcribed text files instead of audio for most testing
 */

import { WhisperSegment } from "./types/audio-intelligence";

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string;
  wordTimestamps?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  segments?: WhisperSegment[];
}

/**
 * Transcribe audio file using OpenAI Whisper via Vercel AI SDK
 */
export async function transcribeAudio(
  audioFile: File
): Promise<TranscriptionResult> {
  try {
    // Convert File to Buffer for OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for Whisper API
    const formData = new FormData();
    formData.append("file", new Blob([buffer]), audioFile.name);
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");
    formData.append("timestamp_granularities[]", "segment");

    // Financial domain vocabulary prompt (improves accuracy for collections terms)
    formData.append("prompt",
      "Financial collections call. Terms: FDCPA, mini-Miranda, past-due, " +
      "delinquent, settlement, payment arrangement, charge-off, creditor, " +
      "debtor, validation notice, cease and desist, hardship, forbearance, " +
      "APR, principal, collection agency, statute of limitations, credit bureau"
    );

    // Call OpenAI Whisper API directly (Vercel AI SDK doesn't have native Whisper support yet)
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Whisper API error: ${error.error?.message || response.statusText}`
      );
    }

    const result = await response.json();

    // Extract word-level timestamps if available
    const wordTimestamps = result.words?.map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    // Extract segment-level quality data
    const segments: WhisperSegment[] | undefined = result.segments?.map((s: any) => ({
      start: s.start,
      end: s.end,
      text: s.text,
      avg_logprob: s.avg_logprob,
      no_speech_prob: s.no_speech_prob,
      compression_ratio: s.compression_ratio,
    }));

    return {
      text: result.text,
      duration: result.duration || 0,
      language: result.language || "en",
      wordTimestamps,
      segments,
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * Validate audio file type and size
 */
export function validateAudioFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
  const ALLOWED_TYPES = [
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4",
  ];

  const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".m4a", ".mp4"];

  // Check file size
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is 25 MB. Your file is ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB.`,
    };
  }

  // Check file type
  const hasValidType = ALLOWED_TYPES.includes(file.type);
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  );

  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type. Allowed formats: WAV, MP3, M4A. Your file type is ${file.type || "unknown"}.`,
    };
  }

  return { valid: true };
}
