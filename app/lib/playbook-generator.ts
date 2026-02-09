/**
 * Playbook generation using gpt-4o
 *
 * COST DISCIPLINE:
 * - Model: gpt-4o (ONLY for playbook generation, most expensive operation)
 * - ONE call per batch (not per call, per BATCH)
 * - Minimal prompt with just the comparison data
 * - NO refinement, NO regeneration
 * - Accept first output
 * - This is the single most expensive LLM operation in the pipeline
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ComparisonResult } from "./comparator";

export interface PlaybookResult {
  title: string;
  content: string; // Markdown format
  callCount: number;
  confidenceScores: {
    dataQuality: number; // 0-1, based on sample size
    differentiationStrength: number; // 0-1, based on how clear the differences are
  };
}

/**
 * Generate behavioral playbook from outcome comparison
 * Single gpt-4o call - most expensive operation
 */
export async function generatePlaybook(
  comparison: ComparisonResult
): Promise<PlaybookResult> {
  const totalCalls = comparison.successCount + comparison.failureCount;

  // Don't generate if insufficient data
  if (totalCalls < 2) {
    return {
      title: "Insufficient Data",
      content: "Need at least 2 calls (1 success, 1 failure) to generate playbook.",
      callCount: totalCalls,
      confidenceScores: {
        dataQuality: 0,
        differentiationStrength: 0,
      },
    };
  }

  try {
    const result = await generateText({
      model: openai("gpt-4o"), // ONLY gpt-4o for playbooks
      prompt: buildPlaybookPrompt(comparison),
      temperature: 0.3, // Slightly creative but consistent
    });

    // Compute confidence scores
    const confidenceScores = computeConfidence(comparison);

    return {
      title: `Playbook (${comparison.successCount} Success / ${comparison.failureCount} Failure)`,
      content: result.text,
      callCount: totalCalls,
      confidenceScores,
    };
  } catch (error) {
    console.error("Playbook generation error:", error);
    throw error; // Don't retry, let caller handle
  }
}

/**
 * Build minimal playbook prompt (version-aware)
 * No examples, no verbose instructions
 */
function buildPlaybookPrompt(comparison: ComparisonResult): string {
  const { successProfile, failureProfile, differentiators } = comparison;

  // Format top differentiators
  const topDiffs = differentiators
    .slice(0, 5)
    .map(
      (d) =>
        `- ${d.feature}: Success=${d.successValue.toFixed(2)}, Failure=${d.failureValue.toFixed(2)} (${d.percentDiff.toFixed(1)}% diff)`
    )
    .join("\n");

  // Detect v3 by checking for v3-specific fields
  const isV3 = (successProfile as any).avg_constraints_per_call !== undefined;

  if (isV3) {
    // V3 Playbook Prompt
    const v3Success = successProfile as any;
    const v3Failure = failureProfile as any;

    return `Generate a concise behavioral playbook for financial call agents based on this analysis.

Sample: ${comparison.successCount} successful calls, ${comparison.failureCount} failed calls

Key Differentiators (Success vs Failure):
${topDiffs}

Success Profile:
- Constraints per call: ${v3Success.avg_constraints_per_call.toFixed(1)}
- Avg resolution latency: ${v3Success.avg_resolution_latency !== null ? v3Success.avg_resolution_latency.toFixed(1) + "s" : "N/A"}
- Control recovery before commitment: ${(v3Success.control_recovery_before_commitment_rate * 100).toFixed(0)}%
- Unresolved constraints: ${v3Success.avg_unresolved_constraints.toFixed(1)}
- Constraint severity: ${(v3Success.avg_constraint_severity * 100).toFixed(0)}%

Failure Profile:
- Constraints per call: ${v3Failure.avg_constraints_per_call.toFixed(1)}
- Avg resolution latency: ${v3Failure.avg_resolution_latency !== null ? v3Failure.avg_resolution_latency.toFixed(1) + "s" : "N/A"}
- Control recovery before commitment: ${(v3Failure.control_recovery_before_commitment_rate * 100).toFixed(0)}%
- Unresolved constraints: ${v3Failure.avg_unresolved_constraints.toFixed(1)}
- Constraint severity: ${(v3Failure.avg_constraint_severity * 100).toFixed(0)}%

Output format (markdown):
# Behavioral Playbook

## Constraint Response Strategy
[Guidance on handling each constraint type (trust, capability, time, authority, risk, clarity) based on data]

## Resolution Timing
[Guidance on when and how quickly to respond to constraints based on data]

## Control Recovery Patterns
[Guidance on when to recover control and maintain it through to commitment based on data]

## Commitment Approach
[Guidance on when to push for commitment vs. wait based on data]

Keep guidance specific, actionable, and data-driven. No generic advice.`;
  }

  // V2 Playbook Prompt
  return `Generate a concise behavioral playbook for financial call agents based on this analysis.

Sample: ${comparison.successCount} successful calls, ${comparison.failureCount} failed calls

Key Differentiators (Success vs Failure):
${topDiffs}

Success Profile:
- Avg signals: ${(successProfile as any).avgSignalCount.toFixed(1)}
- Signal density: ${(successProfile as any).avgSignalDensity.toFixed(2)}/min
- First signal at: ${(successProfile as any).avgFirstSignalTime.toFixed(1)}s
- Signal distribution: ${((successProfile as any).earlySignalRatio * 100).toFixed(0)}% early, ${((successProfile as any).midSignalRatio * 100).toFixed(0)}% mid, ${((successProfile as any).lateSignalRatio * 100).toFixed(0)}% late

Failure Profile:
- Avg signals: ${(failureProfile as any).avgSignalCount.toFixed(1)}
- Signal density: ${(failureProfile as any).avgSignalDensity.toFixed(2)}/min
- First signal at: ${(failureProfile as any).avgFirstSignalTime.toFixed(1)}s
- Signal distribution: ${((failureProfile as any).earlySignalRatio * 100).toFixed(0)}% early, ${((failureProfile as any).midSignalRatio * 100).toFixed(0)}% mid, ${((failureProfile as any).lateSignalRatio * 100).toFixed(0)}% late

Output format (markdown):
# Behavioral Playbook

## Opening Strategy
[Guidance on call opening based on data]

## Objection Handling
[Guidance on handling objections based on data]

## Escalation Management
[Guidance on managing escalations based on data]

## Closing
[Guidance on call closing based on data]

Keep guidance specific, actionable, and data-driven. No generic advice.`;
}

/**
 * Compute confidence scores based on data quality
 */
function computeConfidence(comparison: ComparisonResult): {
  dataQuality: number;
  differentiationStrength: number;
} {
  const totalCalls = comparison.successCount + comparison.failureCount;

  // Data quality: more calls = higher confidence
  // Sigmoid curve: 2 calls = 0.1, 10 calls = 0.5, 50 calls = 0.9
  const dataQuality = 1 / (1 + Math.exp(-0.15 * (totalCalls - 20)));

  // Differentiation strength: average significance of top differentiators
  const topDiffs = comparison.differentiators.slice(0, 5);
  const differentiationStrength =
    topDiffs.length > 0
      ? topDiffs.reduce((sum, d) => sum + d.significance, 0) / topDiffs.length
      : 0;

  return {
    dataQuality: Math.min(dataQuality, 1),
    differentiationStrength: Math.min(differentiationStrength, 1),
  };
}
