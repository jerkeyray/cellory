/**
 * Deterministic transcript chunking
 * ZERO LLM calls - pure computation
 *
 * Cost discipline:
 * - Conservative chunk size (60-90s) to minimize signal extraction calls
 * - 10s overlap for context continuity
 * - Each chunk → 1 LLM call, so fewer chunks = lower cost
 */

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface Chunk {
  chunkIndex: number;
  text: string;
  startTime: number;
  endTime: number;
  wordCount: number;
}

const CHUNK_DURATION = 75; // seconds (middle of 60-90s range)
const OVERLAP_DURATION = 10; // seconds

/**
 * Chunk transcript into time-based segments
 * Uses word timestamps for accuracy, falls back to naive splitting
 */
export function chunkTranscript(
  content: string,
  wordTimestamps?: WordTimestamp[] | null,
  duration?: number | null
): Chunk[] {
  // If we have word timestamps, use them for accurate chunking
  if (wordTimestamps && wordTimestamps.length > 0) {
    return chunkWithTimestamps(content, wordTimestamps);
  }

  // If we have duration but no timestamps, estimate word timing
  if (duration && duration > 0) {
    return chunkWithEstimatedTiming(content, duration);
  }

  // Fallback: chunk by word count (no timing info)
  return chunkByWordCount(content);
}

/**
 * Chunk using word-level timestamps (most accurate)
 */
function chunkWithTimestamps(
  content: string,
  wordTimestamps: WordTimestamp[]
): Chunk[] {
  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let currentStartTime = 0;

  while (currentStartTime < wordTimestamps[wordTimestamps.length - 1].end) {
    const chunkEndTime = currentStartTime + CHUNK_DURATION;

    // Find words in this time window
    const wordsInChunk = wordTimestamps.filter(
      (w) => w.start >= currentStartTime && w.start < chunkEndTime
    );

    if (wordsInChunk.length === 0) break;

    const chunkText = wordsInChunk.map((w) => w.word).join(" ");
    const actualEndTime = wordsInChunk[wordsInChunk.length - 1].end;

    chunks.push({
      chunkIndex,
      text: chunkText,
      startTime: currentStartTime,
      endTime: actualEndTime,
      wordCount: wordsInChunk.length,
    });

    // Move to next chunk with overlap
    currentStartTime += CHUNK_DURATION - OVERLAP_DURATION;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Chunk with estimated timing (when we have duration but no word timestamps)
 */
function chunkWithEstimatedTiming(content: string, duration: number): Chunk[] {
  const words = content.split(/\s+/);
  const wordsPerSecond = words.length / duration;
  const wordsPerChunk = Math.ceil(wordsPerSecond * CHUNK_DURATION);
  const overlapWords = Math.ceil(wordsPerSecond * OVERLAP_DURATION);

  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const chunkWords = words.slice(wordIndex, wordIndex + wordsPerChunk);
    const startTime = wordIndex / wordsPerSecond;
    const endTime = (wordIndex + chunkWords.length) / wordsPerSecond;

    chunks.push({
      chunkIndex,
      text: chunkWords.join(" "),
      startTime,
      endTime,
      wordCount: chunkWords.length,
    });

    wordIndex += wordsPerChunk - overlapWords;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Fallback: chunk by word count (no timing info available)
 */
function chunkByWordCount(content: string): Chunk[] {
  const words = content.split(/\s+/);
  const wordsPerChunk = 150; // ~75s at 2 words/sec (typical speech rate)
  const overlapWords = 20; // ~10s overlap

  const chunks: Chunk[] = [];
  let chunkIndex = 0;
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const chunkWords = words.slice(wordIndex, wordIndex + wordsPerChunk);

    chunks.push({
      chunkIndex,
      text: chunkWords.join(" "),
      startTime: 0, // Unknown
      endTime: 0, // Unknown
      wordCount: chunkWords.length,
    });

    wordIndex += wordsPerChunk - overlapWords;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Calculate cost estimate for processing a transcript
 * Based on gpt-4o-mini pricing: ~$0.15/1M input tokens, ~$0.60/1M output tokens
 */
export function estimateProcessingCost(chunks: Chunk[]): {
  chunkCount: number;
  estimatedInputTokens: number;
  estimatedCostUSD: number;
} {
  const avgWordsPerChunk = chunks.reduce((sum, c) => sum + c.wordCount, 0) / chunks.length;
  const avgTokensPerChunk = Math.ceil(avgWordsPerChunk * 1.3); // ~1.3 tokens per word
  const systemPromptTokens = 150; // Estimated
  const outputTokensPerChunk = 200; // Conservative estimate for signals JSON

  const totalInputTokens = chunks.length * (systemPromptTokens + avgTokensPerChunk);
  const totalOutputTokens = chunks.length * outputTokensPerChunk;

  // gpt-4o-mini pricing
  const inputCost = (totalInputTokens / 1_000_000) * 0.15;
  const outputCost = (totalOutputTokens / 1_000_000) * 0.6;
  const totalCost = inputCost + outputCost;

  return {
    chunkCount: chunks.length,
    estimatedInputTokens: totalInputTokens,
    estimatedCostUSD: totalCost,
  };
}
