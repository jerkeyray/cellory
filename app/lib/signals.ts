/**
 * Signal extraction using gpt-4o-mini
 *
 * COST DISCIPLINE:
 * - Model: gpt-4o-mini ONLY (NOT gpt-4o)
 * - Minimal prompt, no examples, no explanations
 * - Strict JSON schema with Zod
 * - NO retries (accept empty responses)
 * - NO regeneration loops
 * - Each chunk = 1 API call → minimize chunks
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Signal taxonomy (from PRD)
export const SignalType = z.enum([
  "objection",
  "escalation",
  "agreement",
  "uncertainty",
  "resolution_attempt",
]);

export const SignalSchema = z.object({
  type: SignalType,
  confidence: z.number().min(0).max(1),
  startTime: z.number(),
  endTime: z.number(),
  data: z.object({
    description: z.string().max(100), // Keep short for cost
  }),
});

export const SignalsResponseSchema = z.object({
  signals: z.array(SignalSchema),
});

export type Signal = z.infer<typeof SignalSchema>;
export type SignalsResponse = z.infer<typeof SignalsResponseSchema>;

/**
 * Extract behavioral signals from a transcript chunk
 * Uses gpt-4o-mini with strict JSON mode
 */
export async function extractSignals(
  chunkText: string,
  startTime: number,
  endTime: number
): Promise<Signal[]> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"), // MUST be gpt-4o-mini for cost
      schema: SignalsResponseSchema,
      prompt: buildPrompt(chunkText, startTime, endTime),
      temperature: 0, // Deterministic
    });

    return result.object.signals;
  } catch (error) {
    console.error("Signal extraction error:", error);
    // DO NOT RETRY - accept failure and return empty
    return [];
  }
}

/**
 * Build minimal extraction prompt
 * No examples, no explanations, just task definition
 */
function buildPrompt(chunkText: string, startTime: number, endTime: number): string {
  return `Extract behavioral signals from this financial call transcript chunk.

Timeframe: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s

Signal types:
- objection: Customer pushes back or resists
- escalation: Tension/frustration increases
- agreement: Customer shows buy-in or acceptance
- uncertainty: Customer expresses doubt or confusion
- resolution_attempt: Agent tries to resolve an issue

Transcript:
${chunkText}

Return signals with type, confidence (0-1), startTime, endTime (within chunk timeframe), and brief description.
Empty array if no signals detected.`;
}

/**
 * Batch extract signals from multiple chunks
 * Processes sequentially to avoid rate limits
 */
export async function extractSignalsBatch(
  chunks: Array<{ text: string; startTime: number; endTime: number }>
): Promise<Signal[]> {
  const allSignals: Signal[] = [];

  for (const chunk of chunks) {
    const signals = await extractSignals(chunk.text, chunk.startTime, chunk.endTime);
    allSignals.push(...signals);

    // Small delay to avoid rate limits (but not too long - time is money)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allSignals;
}
