/**
 * Decision-grade signal aggregation (v3)
 * ZERO LLM calls - 100% pure computation
 *
 * Computes actionable metrics: resolution latency, control recovery,
 * constraint-commitment pairing
 */

import { DecisionMarker } from "./signals-v3";
import { NLUResults } from "./types/audio-intelligence";

export interface AggregateFeaturesV3 {
  schemaVersion: 3;

  // Constraints
  constraints_per_call: number;
  constraint_type_counts: Record<string, number>;
  time_to_first_constraint: number | null;
  explicit_constraint_ratio: number;
  avg_constraint_severity: number;

  // Resolution
  agent_strategy_count_by_type: Record<string, number>;
  avg_resolution_latency: number | null;
  unresolved_constraint_count: number;

  // Control
  control_shifts: number;
  control_recoveries: number;
  control_recovery_before_commitment: boolean;
  agent_control_ratio: number;

  // Commitments
  commitment_count: number;
  commitment_types: Record<string, number>;
  commitment_after_unresolved_constraint: boolean;
  avg_time_from_last_constraint: number | null;

  // NLU
  intent_distribution: Record<string, number>;
  obligation_count: number;
  obligations_with_deadlines: number;
  regulatory_compliance_score: number;
  entity_count: number;

  // Auxiliary
  predicted_outcome: string | null;
  outcome_confidence: number | null;
  call_tone: string | null;
}

/**
 * Aggregate v3 markers into decision-grade features
 * Pure computation, no randomness, fully auditable
 */
export function aggregateSignalsV3(
  markers: DecisionMarker[],
  auxiliaryMetrics: { predicted_outcome: string | null; outcome_confidence: number | null; call_tone: string | null },
  nluResults?: NLUResults
): AggregateFeaturesV3 {
  if (markers.length === 0) {
    return emptyFeaturesV3(auxiliaryMetrics, nluResults);
  }

  const sorted = [...markers].sort((a, b) => a.time - b.time);

  const constraints = sorted.filter((m) => m.type === "customer_constraint");
  const strategies = sorted.filter((m) => m.type === "agent_response_strategy");
  const controlEvents = sorted.filter((m) => m.type === "control_dynamics");
  const commitments = sorted.filter((m) => m.type === "commitment_quality");

  // --- Constraints ---
  const constraint_type_counts: Record<string, number> = {};
  let explicitCount = 0;
  let severitySum = 0;

  for (const c of constraints) {
    if (c.type !== "customer_constraint") continue;
    constraint_type_counts[c.constraint_type] = (constraint_type_counts[c.constraint_type] || 0) + 1;
    if (c.explicit) explicitCount++;
    severitySum += c.severity;
  }

  const time_to_first_constraint = constraints.length > 0 ? constraints[0].time : null;
  const explicit_constraint_ratio = constraints.length > 0 ? explicitCount / constraints.length : 0;
  const avg_constraint_severity = constraints.length > 0 ? severitySum / constraints.length : 0;

  // --- Resolution ---
  const agent_strategy_count_by_type: Record<string, number> = {};
  for (const s of strategies) {
    if (s.type !== "agent_response_strategy") continue;
    agent_strategy_count_by_type[s.strategy] = (agent_strategy_count_by_type[s.strategy] || 0) + 1;
  }

  // Resolution latency: for each constraint, find next strategy with matching target_constraint
  const resolutionLatencies: number[] = [];
  const resolvedConstraintIndices = new Set<number>();

  for (let ci = 0; ci < constraints.length; ci++) {
    const constraint = constraints[ci];
    // Find next strategy that targets this constraint (by time order)
    for (const strategy of strategies) {
      if (strategy.type !== "agent_response_strategy") continue;
      if (strategy.time > constraint.time) {
        resolutionLatencies.push(strategy.time - constraint.time);
        resolvedConstraintIndices.add(ci);
        break;
      }
    }
  }

  const avg_resolution_latency =
    resolutionLatencies.length > 0
      ? resolutionLatencies.reduce((sum, l) => sum + l, 0) / resolutionLatencies.length
      : null;
  const unresolved_constraint_count = constraints.length - resolvedConstraintIndices.size;

  // --- Control ---
  let control_shifts = 0;
  let control_recoveries = 0;
  let agentControlCount = 0;

  for (const ce of controlEvents) {
    if (ce.type !== "control_dynamics") continue;
    if (ce.event === "control_shift") control_shifts++;
    if (ce.event === "control_recovery") control_recoveries++;
    if (ce.event === "agent_in_control") agentControlCount++;
  }

  const totalControlEvents = controlEvents.length;
  const agent_control_ratio = totalControlEvents > 0 ? agentControlCount / totalControlEvents : 0;

  // Control recovery before commitment
  const lastRecoveryTime = controlEvents
    .filter((e) => e.type === "control_dynamics" && e.event === "control_recovery")
    .reduce((max, e) => Math.max(max, e.time), -1);
  const firstCommitmentTime = commitments.length > 0 ? commitments[0].time : Infinity;
  const control_recovery_before_commitment =
    lastRecoveryTime > 0 && firstCommitmentTime < Infinity && lastRecoveryTime < firstCommitmentTime;

  // --- Commitments ---
  const commitment_types: Record<string, number> = {};
  let timeFromConstraintSum = 0;
  let timeFromConstraintCount = 0;

  for (const cm of commitments) {
    if (cm.type !== "commitment_quality") continue;
    commitment_types[cm.commitment_type] = (commitment_types[cm.commitment_type] || 0) + 1;
    if (cm.time_from_last_constraint >= 0) {
      timeFromConstraintSum += cm.time_from_last_constraint;
      timeFromConstraintCount++;
    }
  }

  const avg_time_from_last_constraint =
    timeFromConstraintCount > 0 ? timeFromConstraintSum / timeFromConstraintCount : null;

  // Commitment after unresolved constraint (RED FLAG)
  let commitment_after_unresolved_constraint = false;
  for (let ci = 0; ci < constraints.length; ci++) {
    if (resolvedConstraintIndices.has(ci)) continue;
    // This constraint is unresolved — check if any commitment occurs after it
    const unresolvedTime = constraints[ci].time;
    if (commitments.some((cm) => cm.time > unresolvedTime)) {
      commitment_after_unresolved_constraint = true;
      break;
    }
  }

  // --- NLU ---
  const intent_distribution: Record<string, number> = {};
  let obligation_count = 0;
  let obligations_with_deadlines = 0;
  let regulatory_compliance_score = 0;
  let entity_count = 0;

  if (nluResults) {
    // Intent distribution
    for (const intent of nluResults.intents) {
      intent_distribution[intent.intent] =
        (intent_distribution[intent.intent] || 0) + 1;
    }

    // Obligation metrics
    obligation_count = nluResults.obligations.length;
    obligations_with_deadlines = nluResults.obligations.filter(
      (o) => o.deadline !== null
    ).length;

    // Regulatory compliance score
    // Expected phrases for collections calls
    const expectedRegTypes = [
      "mini_miranda",
      "fdcpa_disclosure",
      "recording_notice",
    ];
    const presentCount = expectedRegTypes.filter((type) =>
      nluResults.regulatory_phrases.some(
        (p) => p.regulation_type === type && p.present
      )
    ).length;
    regulatory_compliance_score =
      expectedRegTypes.length > 0 ? presentCount / expectedRegTypes.length : 0;

    // Entity count
    entity_count = nluResults.entities.length;
  }

  return {
    schemaVersion: 3,

    constraints_per_call: constraints.length,
    constraint_type_counts,
    time_to_first_constraint,
    explicit_constraint_ratio,
    avg_constraint_severity,

    agent_strategy_count_by_type,
    avg_resolution_latency,
    unresolved_constraint_count,

    control_shifts,
    control_recoveries,
    control_recovery_before_commitment,
    agent_control_ratio,

    commitment_count: commitments.length,
    commitment_types,
    commitment_after_unresolved_constraint,
    avg_time_from_last_constraint,

    intent_distribution,
    obligation_count,
    obligations_with_deadlines,
    regulatory_compliance_score,
    entity_count,

    predicted_outcome: auxiliaryMetrics.predicted_outcome,
    outcome_confidence: auxiliaryMetrics.outcome_confidence,
    call_tone: auxiliaryMetrics.call_tone,
  };
}

/**
 * Empty features for calls with no markers
 */
function emptyFeaturesV3(
  auxiliaryMetrics: { predicted_outcome: string | null; outcome_confidence: number | null; call_tone: string | null },
  nluResults?: NLUResults
): AggregateFeaturesV3 {
  return {
    schemaVersion: 3,

    constraints_per_call: 0,
    constraint_type_counts: {},
    time_to_first_constraint: null,
    explicit_constraint_ratio: 0,
    avg_constraint_severity: 0,

    agent_strategy_count_by_type: {},
    avg_resolution_latency: null,
    unresolved_constraint_count: 0,

    control_shifts: 0,
    control_recoveries: 0,
    control_recovery_before_commitment: false,
    agent_control_ratio: 0,

    commitment_count: 0,
    commitment_types: {},
    commitment_after_unresolved_constraint: false,
    avg_time_from_last_constraint: null,

    intent_distribution: {},
    obligation_count: 0,
    obligations_with_deadlines: 0,
    regulatory_compliance_score: 0,
    entity_count: 0,

    predicted_outcome: auxiliaryMetrics.predicted_outcome,
    outcome_confidence: auxiliaryMetrics.outcome_confidence,
    call_tone: auxiliaryMetrics.call_tone,
  };
}
