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
import { ComparisonResult, SuccessInsights } from "./comparator";

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
    // ENHANCEMENT: Query Backboard for historical context (RAG)
    let historicalContext = '';
    try {
      const { queryBackboardForContext } = await import('./backboard');

      // Get examples from both success and failure outcomes
      const successExamples = await queryBackboardForContext('success', 3);
      const failureExamples = await queryBackboardForContext('failure', 3);

      if (successExamples.length > 0 || failureExamples.length > 0) {
        historicalContext = `

## Historical Context from Backboard

### Success Call Patterns
${successExamples.length > 0 ? successExamples.join('\n\n---\n\n') : 'No historical data yet'}

### Failure Call Patterns
${failureExamples.length > 0 ? failureExamples.join('\n\n---\n\n') : 'No historical data yet'}

Use these real-world examples to inform specific, actionable recommendations in the playbook.
`;
        console.log('[Playbook] Injected historical context from Backboard');
      }
    } catch (ragError) {
      console.warn('[Playbook] RAG retrieval failed, continuing without historical context:', ragError);
    }

    // Generate playbook with context
    const result = await generateText({
      model: openai("gpt-4o"), // ONLY gpt-4o for playbooks
      prompt: buildPlaybookPrompt(comparison) + historicalContext,
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

    return `You are an expert at generating Cellory playbooks. Generate a behavioral playbook for financial call agents based on this analysis.

**CRITICAL: Follow this EXACT markdown structure. This format is optimized for human readability, LLM parsing, and spoken TTS flow.**

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

**Required Output Format (markdown):**

\`\`\`markdown
# [Playbook Title]
[Short descriptive subtitle — e.g. "Winning Constraint Handling Patterns in Financial Collections Calls"]

## Core Success Principles
- Principle 1. Always [clear directive based on data]...
- Principle 2. Use [strategy] in [X%] of winning calls...
- Principle 3. [Another directive]...

## Top Constraint / Objection Types & Winning Responses
### [Constraint Type] ([percentage]% of successful calls)
- Primary winning strategy: **[strategy name]**
- How to apply: [short, directive sentences]
- Example phrasing: "You can say: ..."
- Expected outcome: [benefit / benchmark]

### [Next Constraint Type] ([percentage]%)
[Same structure]

## Key Timing & Performance Benchmarks
- Resolution latency: [value] seconds in successful calls (vs. [value] in failures)
- Time to first constraint: [value] seconds
- [Other timing metrics from the data]

## Control & Recovery Guidelines
- Proactive rule 1: [directive from data]
- Never: [anti-pattern from failures]
- Must: [critical success factor]

## Recommended Call Flow (Step-by-Step)
1. [Step 1] — [action + rationale from data]
2. [Step 2] — [action + rationale]
...

## When to Escalate or Pivot
- Conditions: [based on failure patterns]
- Scripts: [example phrases]

## Data Notes / Evolution
- Derived from: ${comparison.successCount} successful calls (compared to ${comparison.failureCount} failures)
- Last updated: [current date]
- Next improvement: Compare against additional failure patterns to unlock [specific delta]
\`\`\`

**Formatting Rules:**
- Use **bold** for strategy names, key metrics, and directive verbs
- Use short bullet points (1-2 lines max)
- Spell numbers naturally for speech: "eight point five seconds", "around one hundred twenty-four seconds"
- Percentages in parentheses after headings: (42% of cases)
- No long paragraphs — break into bullets or numbered steps
- Keep guidance specific, actionable, and data-driven. No generic advice.`;
  }

  // V2 Playbook Prompt
  return `You are an expert at generating Cellory playbooks. Generate a behavioral playbook for financial call agents based on this analysis.

**CRITICAL: Follow this EXACT markdown structure. This format is optimized for human readability, LLM parsing, and spoken TTS flow.**

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

**Required Output Format (markdown):**

\`\`\`markdown
# [Playbook Title]
[Short descriptive subtitle — e.g. "Winning Signal Patterns in Financial Calls"]

## Core Success Principles
- Principle 1. Always [clear directive based on data]...
- Principle 2. Use [strategy] in [X%] of winning calls...
- Principle 3. [Another directive]...

## Top Signal / Objection Types & Winning Responses
### [Signal Type] ([percentage]% of successful calls)
- Primary winning strategy: **[strategy name]**
- How to apply: [short, directive sentences]
- Example phrasing: "You can say: ..."
- Expected outcome: [benefit / benchmark]

### [Next Signal Type] ([percentage]%)
[Same structure]

## Key Timing & Performance Benchmarks
- First signal timing: [value] seconds in successful calls (vs. [value] in failures)
- Signal density: [value] per minute
- [Other timing metrics from the data]

## Control & Recovery Guidelines
- Proactive rule 1: [directive from data]
- Never: [anti-pattern from failures]
- Must: [critical success factor]

## Recommended Call Flow (Step-by-Step)
1. [Step 1] — [action + rationale from data]
2. [Step 2] — [action + rationale]
...

## When to Escalate or Pivot
- Conditions: [based on failure patterns]
- Scripts: [example phrases]

## Data Notes / Evolution
- Derived from: ${comparison.successCount} successful calls (compared to ${comparison.failureCount} failures)
- Last updated: [current date]
- Next improvement: Compare against additional failure patterns to unlock [specific delta]
\`\`\`

**Formatting Rules:**
- Use **bold** for strategy names, key metrics, and directive verbs
- Use short bullet points (1-2 lines max)
- Spell numbers naturally for speech: "eight point five seconds"
- Percentages in parentheses after headings: (42% of cases)
- No long paragraphs — break into bullets or numbered steps
- Keep guidance specific, actionable, and data-driven. No generic advice.`;
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

// ==================== SUCCESS-ONLY PLAYBOOK ====================

/**
 * Generate playbook from success calls only
 * Used when no failure calls are available
 */
export async function generateSuccessPlaybook(
  insights: SuccessInsights
): Promise<PlaybookResult> {
  if (insights.callCount < 1) {
    return {
      title: "No Data",
      content: "Need at least 1 successful call to generate insights.",
      callCount: 0,
      confidenceScores: {
        dataQuality: 0,
        differentiationStrength: 0,
      },
    };
  }

  try {
    // ENHANCEMENT: Query Backboard for historical success patterns
    let historicalContext = '';
    try {
      const { queryBackboardForContext } = await import('./backboard');
      const successExamples = await queryBackboardForContext('success', 5);

      if (successExamples.length > 0) {
        historicalContext = `

## Historical Success Patterns from Backboard

${successExamples.join('\n\n---\n\n')}

Use these real examples to identify consistent patterns that lead to success.
`;
        console.log('[Success Playbook] Injected historical context from Backboard');
      }
    } catch (ragError) {
      console.warn('[Success Playbook] RAG retrieval failed:', ragError);
    }

    const result = await generateText({
      model: openai("gpt-4o"),
      prompt: buildSuccessPlaybookPrompt(insights) + historicalContext,
      temperature: 0.3,
    });

    // Compute confidence based on sample size only
    const dataQuality = 1 / (1 + Math.exp(-0.15 * (insights.callCount - 20)));

    return {
      title: `Success Patterns (${insights.callCount} Calls)`,
      content: result.text,
      callCount: insights.callCount,
      confidenceScores: {
        dataQuality: Math.min(dataQuality, 1),
        differentiationStrength: 0.5, // Moderate - no comparison baseline
      },
    };
  } catch (error) {
    console.error("Success playbook generation error:", error);
    throw error;
  }
}

/**
 * Build success-only playbook prompt
 */
function buildSuccessPlaybookPrompt(insights: SuccessInsights): string {
  const constraintTypes = Object.entries(insights.constraintTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([type, ratio]) => `- ${type}: ${(ratio * 100).toFixed(0)}%`)
    .join("\n");

  const strategies = Object.entries(insights.strategyUsage)
    .sort((a, b) => b[1] - a[1])
    .map(([strategy, ratio]) => `- ${strategy.replace(/_/g, " ")}: ${(ratio * 100).toFixed(0)}%`)
    .join("\n");

  const patterns = insights.topPatterns
    .map((p) => `- ${p.pattern} (${p.frequency}x)`)
    .join("\n");

  return `You are an expert at generating Cellory playbooks. Generate a success pattern playbook based on ${insights.callCount} successful financial calls.

**CRITICAL: Follow this EXACT markdown structure. This format is optimized for human readability, LLM parsing, and spoken TTS flow.**

**Success Metrics:**
- Avg constraints per call: ${insights.avgConstraintsPerCall.toFixed(1)}
- Avg resolution latency: ${insights.avgResolutionLatency !== null ? insights.avgResolutionLatency.toFixed(1) + "s" : "N/A"}
- Control recovery rate: ${(insights.controlRecoveryRate * 100).toFixed(0)}%
- Control recovery before commitment: ${(insights.controlRecoveryBeforeCommitmentRate * 100).toFixed(0)}%
- Unresolved constraints: ${insights.avgUnresolvedConstraints.toFixed(1)}
- Constraint severity: ${(insights.avgConstraintSeverity * 100).toFixed(0)}%
- Explicit constraints: ${(insights.explicitConstraintRatio * 100).toFixed(0)}%
- Time to first constraint: ${insights.timeToFirstConstraint !== null ? insights.timeToFirstConstraint.toFixed(1) + "s" : "N/A"}

**Constraint Type Distribution:**
${constraintTypes || "None"}

**Strategy Usage:**
${strategies || "None"}

**Common Constraint Patterns:**
${patterns || "None"}

**Required Output Format (markdown):**

\`\`\`markdown
# [Playbook Title]
[Short descriptive subtitle — e.g. "Success Patterns from Financial Collections Calls"]

## Core Success Principles
- Principle 1. Always [clear directive based on observed success patterns]...
- Principle 2. Use [strategy] in [X%] of calls...
- Principle 3. [Another directive from data]...

## Top Constraint / Objection Types & Successful Responses
### [Constraint Type] ([percentage]% of successful calls)
- Primary successful strategy: **[strategy name from data]**
- How to apply: [short, directive sentences]
- Example phrasing: "You can say: ..."
- Expected outcome: [benefit / benchmark from data]

### [Next Constraint Type] ([percentage]%)
[Same structure for each constraint type in distribution]

## Key Timing & Performance Benchmarks
- Resolution latency: around [value] seconds in successful calls
- Time to first constraint: around [value] seconds
- Control recovery rate: [percentage]%
- [Other timing metrics from the data]

## Control & Recovery Guidelines
- Proactive rule 1: [directive from successful patterns]
- Always: [critical success factor from data]
- Must: [another critical success factor]

## Recommended Call Flow (Step-by-Step)
1. [Step 1] — [action + rationale from success data]
2. [Step 2] — [action + rationale]
...

## When to Escalate or Pivot
- Conditions: [based on observed patterns]
- Scripts: [example phrases that work]

## Data Notes / Evolution
- Derived from: ${insights.callCount} successful calls
- Last updated: [current date]
- Next improvement: Compare with failure calls to identify what specifically differentiates success from failure
\`\`\`

**Formatting Rules:**
- Use **bold** for strategy names, key metrics, and directive verbs
- Use short bullet points (1-2 lines max)
- Spell numbers naturally for speech: "eight point five seconds", "around one hundred twenty-four seconds"
- Percentages in parentheses after headings: (42% of cases)
- No long paragraphs — break into bullets or numbered steps
- Focus on what IS working in the data, not what MIGHT work
- Keep guidance specific, actionable, and data-driven. No generic advice.`;
}
