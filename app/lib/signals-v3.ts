/**
 * Decision-grade marker extraction (v3)
 *
 * COST: ~$0.0015 per 5-min call (gpt-4o-mini)
 * Focus: Constraints, strategies, control dynamics, commitment quality
 */

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Decision-grade markers

const CustomerConstraintSchema = z.object({
  type: z.literal("customer_constraint"),
  constraint_type: z.enum(["trust", "capability", "time", "authority", "risk", "clarity"]),
  explicit: z.boolean(),
  severity: z.number().min(0).max(1),
  description: z.string().max(80),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const AgentResponseStrategySchema = z.object({
  type: z.literal("agent_response_strategy"),
  strategy: z.enum([
    "acknowledge_limitation",
    "reframe_scope",
    "reduce_risk",
    "defer_detail",
    "transfer_authority",
    "social_proof",
    "push_commitment",
  ]),
  target_constraint: z.string(),
  description: z.string().max(80),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const ControlDynamicsSchema = z.object({
  type: z.literal("control_dynamics"),
  event: z.enum(["agent_in_control", "customer_in_control", "control_shift", "control_recovery"]),
  cause: z.string(),
  description: z.string().max(80),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const CommitmentQualitySchema = z.object({
  type: z.literal("commitment_quality"),
  commitment_type: z.enum(["followup", "payment", "trial", "demo"]),
  initiated_by: z.enum(["agent", "customer"]),
  reversibility: z.enum(["low", "medium", "high"]),
  time_from_last_constraint: z.number(),
  description: z.string().max(80),
  time: z.number(),
  confidence: z.number().min(0).max(1),
});

const DecisionMarkerSchema = z.union([
  CustomerConstraintSchema,
  AgentResponseStrategySchema,
  ControlDynamicsSchema,
  CommitmentQualitySchema,
]);

// Auxiliary metrics (simplified from v2)
const AuxiliaryMetricsV3Schema = z.object({
  predicted_outcome: z.enum(["success", "failure"]).nullable(),
  outcome_confidence: z.number().min(0).max(1).nullable(),
  outcome_reasoning: z.string().max(150).nullable(),
  call_tone: z.enum(["neutral", "tense", "cooperative"]).nullable(),
});

// Full response schema
const ExtractionResponseV3Schema = z.object({
  markers: z.array(DecisionMarkerSchema),
  auxiliary_metrics: AuxiliaryMetricsV3Schema,
});

export type CustomerConstraint = z.infer<typeof CustomerConstraintSchema>;
export type AgentResponseStrategy = z.infer<typeof AgentResponseStrategySchema>;
export type ControlDynamics = z.infer<typeof ControlDynamicsSchema>;
export type CommitmentQuality = z.infer<typeof CommitmentQualitySchema>;
export type DecisionMarker = z.infer<typeof DecisionMarkerSchema>;
export type AuxiliaryMetricsV3 = z.infer<typeof AuxiliaryMetricsV3Schema>;
export type ExtractionResponseV3 = z.infer<typeof ExtractionResponseV3Schema>;

/**
 * Extract decision-grade markers from transcript chunk
 */
async function extractMarkersV3(
  chunkText: string,
  startTime: number,
  endTime: number
): Promise<ExtractionResponseV3> {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: ExtractionResponseV3Schema,
      prompt: buildPromptV3(chunkText, startTime, endTime),
      temperature: 0,
    });

    return result.object;
  } catch (error) {
    console.error("V3 marker extraction error:", error);
    return {
      markers: [],
      auxiliary_metrics: {
        predicted_outcome: null,
        outcome_confidence: null,
        outcome_reasoning: null,
        call_tone: null,
      },
    };
  }
}

/**
 * Minimal prompt for decision-grade markers
 */
function buildPromptV3(chunkText: string, startTime: number, endTime: number): string {
  return `Extract decision-grade markers from call transcript (${startTime.toFixed(0)}-${endTime.toFixed(0)}s).

Markers:
- customer_constraint (constraint_type: trust|capability|time|authority|risk|clarity, explicit: bool, severity: 0-1)
- agent_response_strategy (strategy: acknowledge_limitation|reframe_scope|reduce_risk|defer_detail|transfer_authority|social_proof|push_commitment, target_constraint: description of constraint being addressed)
- control_dynamics (event: agent_in_control|customer_in_control|control_shift|control_recovery, cause: what caused this)
- commitment_quality (commitment_type: followup|payment|trial|demo, initiated_by: agent|customer, reversibility: low|medium|high, time_from_last_constraint: seconds since last constraint)

Each marker: type, description (max 80 chars), time (single timestamp in seconds), confidence (0-1).

Metrics:
- predicted_outcome (success|failure)
- outcome_confidence 0-1
- outcome_reasoning <150 chars
- call_tone (neutral|tense|cooperative)

Transcript:
${chunkText}

JSON only. Empty array if none.`;
}

/**
 * Batch extract markers from multiple chunks
 */
export async function extractMarkersBatchV3(
  chunks: Array<{ text: string; startTime: number; endTime: number }>
): Promise<ExtractionResponseV3[]> {
  const results: ExtractionResponseV3[] = [];

  for (const chunk of chunks) {
    const result = await extractMarkersV3(chunk.text, chunk.startTime, chunk.endTime);
    results.push(result);

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Merge results from multiple chunks
 */
export function mergeExtractionResultsV3(
  results: ExtractionResponseV3[]
): ExtractionResponseV3 {
  const allMarkers: DecisionMarker[] = [];
  const metricsAccum: Partial<AuxiliaryMetricsV3> = {};

  for (const result of results) {
    allMarkers.push(...result.markers);

    if (result.auxiliary_metrics.call_tone) {
      metricsAccum.call_tone = result.auxiliary_metrics.call_tone;
    }
    // Predicted outcome: take last chunk's prediction (final chunk has full context)
    if (result.auxiliary_metrics.predicted_outcome) {
      metricsAccum.predicted_outcome = result.auxiliary_metrics.predicted_outcome;
      metricsAccum.outcome_confidence = result.auxiliary_metrics.outcome_confidence;
      metricsAccum.outcome_reasoning = result.auxiliary_metrics.outcome_reasoning;
    }
  }

  return {
    markers: allMarkers,
    auxiliary_metrics: metricsAccum as AuxiliaryMetricsV3,
  };
}
