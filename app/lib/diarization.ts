/**
 * Add speaker labels to transcript using gpt-4o-mini
 * Cost: ~$0.0005 per transcript (one-time, not per chunk)
 */

import { generateText, generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { DiarizationSegment } from "./types/audio-intelligence";

/**
 * Add Agent/Customer labels to transcript
 */
export async function addSpeakerLabels(rawTranscript: string): Promise<string> {
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Add speaker labels to this financial call transcript. Label each line as "Agent:" or "Customer:".

Rules:
- Agent speaks first (greeting)
- Format: "Speaker: text"
- Keep exact wording
- One line per speaking turn
- No extra commentary

Transcript:
${rawTranscript}

Output format:
Agent: [text]
Customer: [text]`,
      temperature: 0,
    });

    return result.text;
  } catch (error) {
    console.error("Speaker labeling error:", error);
    // Fallback: return original with basic formatting
    return rawTranscript;
  }
}

/**
 * Add structured speaker labels with timestamps
 * Returns array of diarization segments with real timestamps
 */
export async function addSpeakerLabelsStructured(
  rawTranscript: string,
  wordTimestamps: Array<{ word: string; start: number; end: number }>
): Promise<DiarizationSegment[]> {
  try {
    // Zod schema for structured diarization
    const DiarizationSchema = z.object({
      turns: z.array(
        z.object({
          speaker: z.enum(["Agent", "Customer"]),
          text: z.string(),
          approx_word_index_start: z.number(),
          approx_word_index_end: z.number(),
        })
      ),
    });

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: DiarizationSchema,
      prompt: `Add speaker labels to this financial call transcript. Return structured turns with approximate word index ranges.

Rules:
- Agent speaks first (greeting)
- Identify speaking turns and their approximate position in the transcript
- approx_word_index_start/end should be the word indices (0-based) in the transcript
- Keep exact wording

Transcript:
${rawTranscript}

Return a JSON object with turns array.`,
      temperature: 0,
    });

    // Map word indices to actual timestamps
    const segments: DiarizationSegment[] = result.object.turns.map((turn) => {
      // Clamp indices to valid range
      const startIdx = Math.max(0, Math.min(turn.approx_word_index_start, wordTimestamps.length - 1));
      const endIdx = Math.max(0, Math.min(turn.approx_word_index_end, wordTimestamps.length - 1));

      const startTime = wordTimestamps[startIdx]?.start || 0;
      const endTime = wordTimestamps[endIdx]?.end || startTime;

      return {
        speaker: turn.speaker,
        text: turn.text,
        start: startTime,
        end: endTime,
      };
    });

    return segments;
  } catch (error) {
    console.error("Structured diarization error:", error);
    // Fallback: return empty array
    return [];
  }
}
