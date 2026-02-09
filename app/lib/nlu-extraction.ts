/**
 * NLU (Natural Language Understanding) marker extraction
 * Financial domain: intents, obligations, regulatory phrases, entities
 *
 * COST: ~$0.0012 per 5-min call (gpt-4o-mini)
 * Pattern: Same as signals-v3.ts (Zod schemas → generateObject → batch + merge)
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  IntentClassification,
  ObligationDetection,
  RegulatoryPhrase,
  EntityMention,
  NLUResults,
} from "./types/audio-intelligence";

// ============================================================================
// Zod Schemas
// ============================================================================

const IntentSchema = z.object({
  intent: z.enum([
    "payment_arrangement",
    "dispute",
    "information_request",
    "callback_request",
    "escalation",
    "compliance_concern",
    "settlement_offer",
  ]),
  speaker: z.enum(["Agent", "Customer"]),
  description: z.string().max(150),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const ObligationSchema = z.object({
  obligation_type: z.enum([
    "promise_to_pay",
    "callback_commitment",
    "document_provision",
    "escalation_promise",
    "review_commitment",
  ]),
  obligor: z.enum(["Agent", "Customer"]),
  deadline: z.string().nullable(),
  description: z.string().max(150),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const RegulatoryPhraseSchema = z.object({
  regulation_type: z.enum([
    "mini_miranda",
    "fdcpa_disclosure",
    "recording_notice",
    "cease_communication",
    "dispute_rights",
    "validation_notice",
  ]),
  present: z.boolean(),
  verbatim: z.string(),
  time: z.number().nullable(),
  confidence: z.number().min(0).max(1),
});

const EntitySchema = z.object({
  entity_type: z.enum([
    "amount",
    "date",
    "account_number",
    "phone_number",
    "reference_number",
  ]),
  value: z.string(),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const NLUExtractionSchema = z.object({
  intents: z.array(IntentSchema),
  obligations: z.array(ObligationSchema),
  regulatory_phrases: z.array(RegulatoryPhraseSchema),
  entities: z.array(EntitySchema),
});

export type NLUExtractionResult = z.infer<typeof NLUExtractionSchema>;

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract NLU markers from transcript chunk
 */
export async function extractNLUMarkers(
  chunkText: string,
  startTime: number,
  endTime: number
): Promise<NLUExtractionResult> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: NLUExtractionSchema,
      prompt: buildNLUPrompt(chunkText, startTime, endTime),
      temperature: 0,
    });

    return result.object;
  } catch (error) {
    console.error("NLU extraction error:", error);
    return {
      intents: [],
      obligations: [],
      regulatory_phrases: [],
      entities: [],
    };
  }
}

/**
 * Build NLU extraction prompt
 */
function buildNLUPrompt(
  chunkText: string,
  startTime: number,
  endTime: number
): string {
  return `Extract NLU markers from financial collections call transcript (${startTime.toFixed(0)}-${endTime.toFixed(0)}s).

**Intent Classification** (per speaker turn):
- payment_arrangement: Discussing payment plans, installments
- dispute: Customer disputes the debt
- information_request: Requesting account details, validation
- callback_request: Scheduling a follow-up call
- escalation: Request to speak with supervisor
- compliance_concern: Concerns about rights, regulations
- settlement_offer: Offering to settle for less

**Obligation Detection** (action items, promises):
- promise_to_pay: Commitment to make payment
- callback_commitment: Promise to call back
- document_provision: Agree to send/receive documents
- escalation_promise: Commit to escalate issue
- review_commitment: Promise to review account/options

**Regulatory Phrases** (compliance language):
- mini_miranda: "This is an attempt to collect a debt..."
- fdcpa_disclosure: FDCPA rights disclosure
- recording_notice: "This call may be recorded..."
- cease_communication: Customer requests no contact
- dispute_rights: Right to dispute debt within 30 days
- validation_notice: Debt validation notice mentioned

**Entity Mentions** (structured data):
- amount: Dollar amounts ($XXX, payment amounts)
- date: Dates (payment due, callback scheduled)
- account_number: Account/reference numbers
- phone_number: Contact numbers mentioned
- reference_number: Case/ticket/confirmation numbers

Each marker needs:
- description (max 150 chars)
- time (single timestamp in seconds)
- confidence (0-1)

For regulatory phrases: set "present" true/false, "verbatim" with exact text (or expected text if missing), "time" null if not present.

Transcript:
${chunkText}

JSON only. Empty arrays if none found.`;
}

/**
 * Batch extract NLU markers from multiple chunks (sequential with delay)
 */
export async function extractNLUMarkersBatch(
  chunks: Array<{ text: string; startTime: number; endTime: number }>
): Promise<NLUExtractionResult[]> {
  const results: NLUExtractionResult[] = [];

  for (const chunk of chunks) {
    const result = await extractNLUMarkers(
      chunk.text,
      chunk.startTime,
      chunk.endTime
    );
    results.push(result);

    // 100ms delay between requests (same as signals-v3)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Merge NLU results from multiple chunks
 */
export function mergeNLUResults(
  results: NLUExtractionResult[]
): NLUResults {
  const merged: NLUResults = {
    intents: [],
    obligations: [],
    regulatory_phrases: [],
    entities: [],
  };

  for (const result of results) {
    merged.intents.push(...result.intents);
    merged.obligations.push(...result.obligations);
    merged.regulatory_phrases.push(...result.regulatory_phrases);
    merged.entities.push(...result.entities);
  }

  // Deduplicate regulatory phrases (take first occurrence)
  const seenRegTypes = new Set<string>();
  merged.regulatory_phrases = merged.regulatory_phrases.filter((phrase) => {
    if (seenRegTypes.has(phrase.regulation_type)) {
      return false;
    }
    seenRegTypes.add(phrase.regulation_type);
    return true;
  });

  return merged;
}
