/**
 * Backboard API integration (stub)
 *
 * Builds behavioral summaries for future Backboard integration.
 * sendToBackboard() is a placeholder — requires Backboard API key and endpoint setup.
 */

import { DecisionMarker } from "./signals-v3";
import { AggregateFeaturesV3 } from "./aggregator-v3";

/**
 * Build behavioral summary from v3 markers and aggregates
 * Pure computation, deterministic output
 */
export function buildBehavioralSummary(
  markers: DecisionMarker[],
  aggregates: AggregateFeaturesV3,
  outcome: string
): string {
  const lines: string[] = [];

  lines.push(`Outcome: ${outcome}`);
  lines.push("");

  // Primary constraint
  const constraints = markers.filter((m) => m.type === "customer_constraint");
  if (constraints.length > 0 && constraints[0].type === "customer_constraint") {
    const primaryConstraint = constraints[0];
    lines.push(`Primary constraint: ${primaryConstraint.constraint_type}`);
    lines.push(
      `  - Explicit: ${primaryConstraint.explicit ? "yes" : "no"}, Severity: ${(primaryConstraint.severity * 100).toFixed(0)}%`
    );
  } else {
    lines.push("Primary constraint: none");
  }
  lines.push("");

  // Resolution strategy
  const strategies = markers.filter((m) => m.type === "agent_response_strategy");
  if (strategies.length > 0 && strategies[0].type === "agent_response_strategy") {
    const firstStrategy = strategies[0];
    lines.push(`Resolution strategy: ${firstStrategy.strategy.replace(/_/g, " ")}`);
    lines.push(`  - Target: ${firstStrategy.target_constraint}`);
  } else {
    lines.push("Resolution strategy: none");
  }
  lines.push("");

  // Control dynamics
  if (aggregates.control_recovery_before_commitment) {
    lines.push("Control recovered before commitment: YES");
  } else {
    lines.push("Control recovered before commitment: NO");
  }
  lines.push(`Control recoveries: ${aggregates.control_recoveries}`);
  lines.push(`Agent control ratio: ${(aggregates.agent_control_ratio * 100).toFixed(0)}%`);
  lines.push("");

  // Commitment timing
  const commitments = markers.filter((m) => m.type === "commitment_quality");
  if (commitments.length > 0 && commitments[0].type === "commitment_quality") {
    const firstCommitment = commitments[0];
    lines.push(`Commitment: ${firstCommitment.commitment_type}`);
    lines.push(`  - Initiated by: ${firstCommitment.initiated_by}`);
    lines.push(`  - Reversibility: ${firstCommitment.reversibility}`);
    if (firstCommitment.time_from_last_constraint >= 0) {
      lines.push(
        `  - Time from last constraint: ${firstCommitment.time_from_last_constraint.toFixed(0)}s`
      );
    }
  }
  lines.push("");

  // Resolution metrics
  if (aggregates.avg_resolution_latency !== null) {
    lines.push(`Avg resolution latency: ${aggregates.avg_resolution_latency.toFixed(1)}s`);
  }
  lines.push(`Unresolved constraints: ${aggregates.unresolved_constraint_count}`);

  // RED FLAG
  if (aggregates.commitment_after_unresolved_constraint) {
    lines.push("");
    lines.push("⚠️  RED FLAG: Commitment after unresolved constraint");
  }

  return lines.join("\n");
}

/**
 * Send behavioral summary to Backboard (placeholder)
 *
 * TODO: Implement when Backboard integration is ready
 * - Requires Backboard API key
 * - Requires assistant_id and thread_id
 * - Use POST /threads/{thread_id}/messages endpoint
 *
 * Example implementation:
 * ```
 * const response = await fetch(`https://app.backboard.io/api/threads/${threadId}/messages`, {
 *   method: 'POST',
 *   headers: {
 *     'X-API-Key': process.env.BACKBOARD_API_KEY,
 *     'Content-Type': 'multipart/form-data',
 *   },
 *   body: formData with content=summary, memory='Auto', stream=false
 * });
 * ```
 */
export async function sendToBackboard(
  summary: string,
  callId: string,
  outcome: string
): Promise<null> {
  // Placeholder — does not send to Backboard yet
  console.log(`[Backboard stub] Would send summary for call ${callId}:`);
  console.log(summary);
  return null;
}
