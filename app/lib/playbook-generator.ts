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
      maxTokens: 1500, // Cap output length for cost control
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
 * Build minimal playbook prompt
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

  return `Generate a concise behavioral playbook for financial call agents based on this analysis.

Sample: ${comparison.successCount} successful calls, ${comparison.failureCount} failed calls

Key Differentiators (Success vs Failure):
${topDiffs}

Success Profile:
- Avg signals: ${successProfile.avgSignalCount.toFixed(1)}
- Signal density: ${successProfile.avgSignalDensity.toFixed(2)}/min
- First signal at: ${successProfile.avgFirstSignalTime.toFixed(1)}s
- Signal distribution: ${(successProfile.earlySignalRatio * 100).toFixed(0)}% early, ${(successProfile.midSignalRatio * 100).toFixed(0)}% mid, ${(successProfile.lateSignalRatio * 100).toFixed(0)}% late

Failure Profile:
- Avg signals: ${failureProfile.avgSignalCount.toFixed(1)}
- Signal density: ${failureProfile.avgSignalDensity.toFixed(2)}/min
- First signal at: ${failureProfile.avgFirstSignalTime.toFixed(1)}s
- Signal distribution: ${(failureProfile.earlySignalRatio * 100).toFixed(0)}% early, ${(failureProfile.midSignalRatio * 100).toFixed(0)}% mid, ${(failureProfile.lateSignalRatio * 100).toFixed(0)}% late

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
