/**
 * Audio quality score computation
 * Pure computation, zero LLM calls
 */

import {
  WhisperSegment,
  AudioMetadata,
  AudioQualityScore,
  QualityFlag,
} from "./types/audio-intelligence";

/**
 * Compute audio quality score from Whisper segments and audio metadata
 * Returns normalized 0-1 scores with quality flags
 */
export function computeQualityScore(
  segments: WhisperSegment[],
  metadata: AudioMetadata,
  durationSeconds?: number
): AudioQualityScore {
  const flags: QualityFlag[] = [];

  // Handle empty segments
  if (segments.length === 0) {
    return {
      overall: 0,
      confidence: 0,
      speechRatio: 0,
      compressionHealth: 0,
      flags: ["low_confidence"],
    };
  }

  // 1. Confidence score from avg_logprob
  // Whisper avg_logprob typically ranges from ~-2 to 0 (higher is better)
  // Map to 0-1 scale: good values are around -0.3 to 0
  const avgLogprob =
    segments.reduce((sum, s) => sum + s.avg_logprob, 0) / segments.length;
  const confidence = Math.max(0, Math.min(1, (avgLogprob + 1.5) / 1.5));

  if (avgLogprob < -1.0) {
    flags.push("low_confidence");
  }

  // 2. Speech ratio from no_speech_prob
  // Lower no_speech_prob is better (means more speech)
  const avgNoSpeechProb =
    segments.reduce((sum, s) => sum + s.no_speech_prob, 0) / segments.length;
  const speechRatio = 1 - avgNoSpeechProb;

  if (avgNoSpeechProb > 0.6) {
    flags.push("high_noise");
  }

  // 3. Compression health from compression_ratio
  // Healthy range is 1.0-3.0
  // Too low = gibberish, too high = repetitive text
  const avgCompressionRatio =
    segments.reduce((sum, s) => sum + s.compression_ratio, 0) / segments.length;

  let compressionHealth = 1.0;
  if (avgCompressionRatio < 1.0) {
    compressionHealth = avgCompressionRatio; // Degrade linearly below 1.0
    flags.push("poor_compression");
  } else if (avgCompressionRatio > 3.0) {
    compressionHealth = Math.max(0, 1.0 - (avgCompressionRatio - 3.0) / 3.0);
    flags.push("poor_compression");
  }

  // 4. Check duration
  if (durationSeconds && durationSeconds < 30) {
    flags.push("short_duration");
  }

  // 5. Check sample rate
  if (metadata.sampleRate > 0 && metadata.sampleRate < 16000) {
    flags.push("low_sample_rate");
  }

  // Compute overall weighted score
  // Prioritize confidence and speech ratio
  const overall =
    0.5 * confidence + 0.3 * speechRatio + 0.2 * compressionHealth;

  return {
    overall,
    confidence,
    speechRatio,
    compressionHealth,
    flags,
  };
}
