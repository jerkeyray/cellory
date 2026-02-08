/**
 * Agent-trainable behavioral marker extraction
 *
 * COST: ~$0.0015 per 5-min call (gpt-4o-mini)
 * Focus: State changes, not emotions
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Agent-trainable markers (Section A)
const CommitmentEventSchema = z.object({
  type: z.literal("commitment_event"),
  subtype: z.enum(["explicit_commitment", "conditional_commitment", "deferral", "refusal"]),
  description: z.string().max(80),
  startTime: z.number(),
  endTime: z.number(),
  confidence: z.number().min(0).max(1),
});

const BlockerEventSchema = z.object({
  type: z.literal("blocker_event"),
  blockerType: z.enum([
    "tax_concern",
    "compliance_claim",
    "authority_required",
    "trust_issue",
    "financial_constraint",
    "other"
  ]),
  resolved: z.boolean(),
  description: z.string().max(80),
  startTime: z.number(),
  endTime: z.number(),
  confidence: z.number().min(0).max(1),
});

const ResolutionAttemptSchema = z.object({
  type: z.literal("resolution_attempt"),
  strategy: z.enum([
    "reframe",
    "clarification",
    "authority_transfer",
    "reassurance",
    "alternative_offer",
    "other"
  ]),
  description: z.string().max(80),
  startTime: z.number(),
  endTime: z.number(),
  confidence: z.number().min(0).max(1),
});

const ControlEventSchema = z.object({
  type: z.literal("control_event"),
  controller: z.enum(["agent", "customer"]),
  reason: z.enum(["questioning", "correcting", "interrupting", "redirecting", "asserting"]),
  description: z.string().max(80),
  startTime: z.number(),
  endTime: z.number(),
  confidence: z.number().min(0).max(1),
});

const StallEventSchema = z.object({
  type: z.literal("stall_event"),
  stallType: z.enum(["pause", "circular_discussion", "repeated_deferral", "lack_of_progress"]),
  description: z.string().max(80),
  startTime: z.number(),
  endTime: z.number(),
  confidence: z.number().min(0).max(1),
});

const AgentMarkerSchema = z.union([
  CommitmentEventSchema,
  BlockerEventSchema,
  ResolutionAttemptSchema,
  ControlEventSchema,
  StallEventSchema,
]);

// Auxiliary metrics (Section B - reporting only)
// Use nullable instead of optional for OpenAI strict JSON mode
const AuxiliaryMetricsSchema = z.object({
  call_tone: z.enum(["neutral", "tense", "cooperative"]).nullable(),
  financial_discussion: z.boolean().nullable(),
  mentions_taxes: z.boolean().nullable(),
  mentions_fees: z.boolean().nullable(),
  mentions_refunds: z.boolean().nullable(),
  mentions_withdrawals: z.boolean().nullable(),
  compliance_language: z.boolean().nullable(),
  agent_turns: z.number().nullable(),
  customer_turns: z.number().nullable(),
  clear_outcome: z.boolean().nullable(),
  predicted_outcome: z.enum(["success", "failure"]).nullable(),
  outcome_confidence: z.number().min(0).max(1).nullable(),
  outcome_reasoning: z.string().max(150).nullable(),
});

// Full response schema
const ExtractionResponseSchema = z.object({
  agent_markers: z.array(AgentMarkerSchema),
  auxiliary_metrics: AuxiliaryMetricsSchema,
});

export type AgentMarker = z.infer<typeof AgentMarkerSchema>;
export type AuxiliaryMetrics = z.infer<typeof AuxiliaryMetricsSchema>;
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

/**
 * Extract agent-trainable markers from transcript chunk
 */
export async function extractMarkers(
  chunkText: string,
  startTime: number,
  endTime: number
): Promise<ExtractionResponse> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ExtractionResponseSchema,
      prompt: buildPrompt(chunkText, startTime, endTime),
      temperature: 0,
    });

    return result.object;
  } catch (error) {
    console.error("Marker extraction error:", error);
    return { agent_markers: [], auxiliary_metrics: {} };
  }
}

/**
 * Minimal prompt for agent-trainable markers
 */
function buildPrompt(chunkText: string, startTime: number, endTime: number): string {
  return `Extract markers from call transcript (${startTime.toFixed(0)}-${endTime.toFixed(0)}s).

Markers:
- commitment_event (explicit_commitment|conditional_commitment|deferral|refusal)
- blocker_event (tax_concern|compliance_claim|authority_required|trust_issue|financial_constraint, resolved bool)
- resolution_attempt (reframe|clarification|authority_transfer|reassurance|alternative_offer)
- control_event (controller: agent|customer, reason: questioning|correcting|interrupting|redirecting|asserting)
- stall_event (pause|circular_discussion|repeated_deferral|lack_of_progress)

Metrics:
- call_tone (neutral|tense|cooperative)
- financial_discussion bool
- predicted_outcome (success|failure)
- outcome_confidence 0-1
- outcome_reasoning <150 chars

Transcript:
${chunkText}

JSON only. Empty array if none.`;
}

/**
 * Batch extract markers from multiple chunks
 */
export async function extractMarkersBatch(
  chunks: Array<{ text: string; startTime: number; endTime: number }>
): Promise<ExtractionResponse[]> {
  const results: ExtractionResponse[] = [];

  for (const chunk of chunks) {
    const result = await extractMarkers(chunk.text, chunk.startTime, chunk.endTime);
    results.push(result);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Merge results from multiple chunks
 */
export function mergeExtractionResults(
  results: ExtractionResponse[]
): ExtractionResponse {
  const allMarkers: AgentMarker[] = [];
  const metricsAccum: Partial<AuxiliaryMetrics> = {};

  for (const result of results) {
    allMarkers.push(...result.agent_markers);

    // Merge metrics (last non-null wins for booleans, sum for counts)
    if (result.auxiliary_metrics.call_tone) {
      metricsAccum.call_tone = result.auxiliary_metrics.call_tone;
    }
    if (result.auxiliary_metrics.financial_discussion !== undefined) {
      metricsAccum.financial_discussion = result.auxiliary_metrics.financial_discussion;
    }
    if (result.auxiliary_metrics.agent_turns) {
      metricsAccum.agent_turns = (metricsAccum.agent_turns || 0) + result.auxiliary_metrics.agent_turns;
    }
    if (result.auxiliary_metrics.customer_turns) {
      metricsAccum.customer_turns = (metricsAccum.customer_turns || 0) + result.auxiliary_metrics.customer_turns;
    }
    // Booleans: true if any chunk has true
    if (result.auxiliary_metrics.mentions_taxes) metricsAccum.mentions_taxes = true;
    if (result.auxiliary_metrics.mentions_fees) metricsAccum.mentions_fees = true;
    if (result.auxiliary_metrics.mentions_refunds) metricsAccum.mentions_refunds = true;
    if (result.auxiliary_metrics.mentions_withdrawals) metricsAccum.mentions_withdrawals = true;
    if (result.auxiliary_metrics.compliance_language) metricsAccum.compliance_language = true;
    if (result.auxiliary_metrics.clear_outcome !== undefined) {
      metricsAccum.clear_outcome = result.auxiliary_metrics.clear_outcome;
    }
    // Predicted outcome: take last chunk's prediction (usually final chunk has full context)
    if (result.auxiliary_metrics.predicted_outcome) {
      metricsAccum.predicted_outcome = result.auxiliary_metrics.predicted_outcome;
      metricsAccum.outcome_confidence = result.auxiliary_metrics.outcome_confidence;
      metricsAccum.outcome_reasoning = result.auxiliary_metrics.outcome_reasoning;
    }
  }

  return {
    agent_markers: allMarkers,
    auxiliary_metrics: metricsAccum as AuxiliaryMetrics,
  };
}
