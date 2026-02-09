/**
 * Deterministic outcome comparison
 * ZERO LLM calls - 100% pure statistics
 *
 * Cost discipline: This is free (no API calls)
 * We identify meaningful differences using pure math
 */

import { AggregateFeatures } from "./aggregator";
import { AggregateFeaturesV3 } from "./aggregator-v3";

export interface ComparisonResult {
  successCount: number;
  failureCount: number;
  differentiators: Differentiator[];
  successProfile: FeatureProfile;
  failureProfile: FeatureProfile;
}

export interface Differentiator {
  feature: string;
  successValue: number;
  failureValue: number;
  absoluteDiff: number;
  percentDiff: number;
  significance: number; // 0-1, higher = more important
}

export interface FeatureProfile {
  avgSignalCount: number;
  avgSignalDensity: number;
  signalTypeRatios: Record<string, number>;
  avgFirstSignalTime: number;
  avgConfidence: number;
  earlySignalRatio: number;
  midSignalRatio: number;
  lateSignalRatio: number;
  topSequences: Array<{ pattern: string; count: number }>;
}

// V3 Profile
export interface FeatureProfileV3 {
  avg_constraints_per_call: number;
  avg_resolution_latency: number | null;
  control_recovery_before_commitment_rate: number;
  commitment_after_unresolved_rate: number;
  avg_time_to_first_constraint: number | null;
  avg_constraint_severity: number;
  explicit_constraint_ratio: number;
  constraint_type_distribution: Record<string, number>;
  strategy_usage: Record<string, number>;
  avg_unresolved_constraints: number;
  control_shift_rate: number;
  control_recovery_rate: number;
  agent_control_ratio: number;
}

export interface ComparisonResultV3 {
  successCount: number;
  failureCount: number;
  differentiators: Differentiator[];
  successProfile: FeatureProfileV3;
  failureProfile: FeatureProfileV3;
  schemaVersion: 3;
}

/**
 * Compare success vs failure calls (version-aware)
 * Detects v2 vs v3 aggregates and routes to appropriate comparison
 * Pure computation: means, differences, rankings
 */
export function compareOutcomes(
  successAggregates: (AggregateFeatures | AggregateFeaturesV3)[],
  failureAggregates: (AggregateFeatures | AggregateFeaturesV3)[]
): ComparisonResult | ComparisonResultV3 {
  if (successAggregates.length === 0 || failureAggregates.length === 0) {
    return emptyComparison();
  }

  // Detect v3 by checking for schemaVersion field
  const isV3 = (agg: any): agg is AggregateFeaturesV3 => agg.schemaVersion === 3;

  const hasV3Success = successAggregates.some(isV3);
  const hasV3Failure = failureAggregates.some(isV3);

  // If both have v3, use v3 comparison
  if (hasV3Success && hasV3Failure) {
    const v3Success = successAggregates.filter(isV3);
    const v3Failure = failureAggregates.filter(isV3);
    return compareOutcomesV3(v3Success, v3Failure);
  }

  // Fall back to v2 comparison
  const v2Success = successAggregates.filter((a) => !isV3(a)) as AggregateFeatures[];
  const v2Failure = failureAggregates.filter((a) => !isV3(a)) as AggregateFeatures[];

  if (v2Success.length === 0 || v2Failure.length === 0) {
    return emptyComparison();
  }

  const successProfile = computeProfile(v2Success);
  const failureProfile = computeProfile(v2Failure);

  const differentiators = computeDifferentiators(
    successProfile,
    failureProfile,
    v2Success,
    v2Failure
  );

  return {
    successCount: v2Success.length,
    failureCount: v2Failure.length,
    differentiators,
    successProfile,
    failureProfile,
  };
}

/**
 * Compute aggregate profile for a group of calls
 */
function computeProfile(aggregates: AggregateFeatures[]): FeatureProfile {
  const count = aggregates.length;

  // Average metrics
  const avgSignalCount =
    aggregates.reduce((sum, a) => sum + a.totalSignals, 0) / count;
  const avgSignalDensity =
    aggregates.reduce((sum, a) => sum + a.signalDensity, 0) / count;
  const avgConfidence =
    aggregates.reduce((sum, a) => sum + a.avgConfidence, 0) / count;

  // First signal timing (filter nulls)
  const firstSignalTimes = aggregates
    .map((a) => a.firstSignalTime)
    .filter((t): t is number => t !== null);
  const avgFirstSignalTime =
    firstSignalTimes.length > 0
      ? firstSignalTimes.reduce((sum, t) => sum + t, 0) / firstSignalTimes.length
      : 0;

  // Signal distribution
  const totalSignals = aggregates.reduce((sum, a) => sum + a.totalSignals, 0);
  const earlySignalRatio =
    totalSignals > 0
      ? aggregates.reduce((sum, a) => sum + a.earlyThirdSignals, 0) / totalSignals
      : 0;
  const midSignalRatio =
    totalSignals > 0
      ? aggregates.reduce((sum, a) => sum + a.midThirdSignals, 0) / totalSignals
      : 0;
  const lateSignalRatio =
    totalSignals > 0
      ? aggregates.reduce((sum, a) => sum + a.lateThirdSignals, 0) / totalSignals
      : 0;

  // Signal type ratios
  const allCounts: Record<string, number> = {};
  for (const agg of aggregates) {
    for (const [type, count] of Object.entries(agg.signalCounts)) {
      allCounts[type] = (allCounts[type] || 0) + count;
    }
  }

  const signalTypeRatios: Record<string, number> = {};
  for (const [type, count] of Object.entries(allCounts)) {
    signalTypeRatios[type] = totalSignals > 0 ? count / totalSignals : 0;
  }

  // Top sequences
  const allSequences: Record<string, number> = {};
  for (const agg of aggregates) {
    for (const [seq, count] of Object.entries(agg.signalSequences)) {
      allSequences[seq] = (allSequences[seq] || 0) + count;
    }
  }

  const topSequences = Object.entries(allSequences)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    avgSignalCount,
    avgSignalDensity,
    signalTypeRatios,
    avgFirstSignalTime,
    avgConfidence,
    earlySignalRatio,
    midSignalRatio,
    lateSignalRatio,
    topSequences,
  };
}

/**
 * Compute and rank differentiators
 */
function computeDifferentiators(
  successProfile: FeatureProfile,
  failureProfile: FeatureProfile,
  successAggregates: AggregateFeatures[],
  failureAggregates: AggregateFeatures[]
): Differentiator[] {
  const diffs: Differentiator[] = [];

  // Signal count
  diffs.push({
    feature: "Signal Count",
    successValue: successProfile.avgSignalCount,
    failureValue: failureProfile.avgSignalCount,
    ...computeDiff(successProfile.avgSignalCount, failureProfile.avgSignalCount),
  });

  // Signal density
  diffs.push({
    feature: "Signal Density (per minute)",
    successValue: successProfile.avgSignalDensity,
    failureValue: failureProfile.avgSignalDensity,
    ...computeDiff(successProfile.avgSignalDensity, failureProfile.avgSignalDensity),
  });

  // First signal timing
  diffs.push({
    feature: "First Signal Time (seconds)",
    successValue: successProfile.avgFirstSignalTime,
    failureValue: failureProfile.avgFirstSignalTime,
    ...computeDiff(
      successProfile.avgFirstSignalTime,
      failureProfile.avgFirstSignalTime,
      true // Lower is better for timing
    ),
  });

  // Distribution ratios
  diffs.push({
    feature: "Early Signals Ratio",
    successValue: successProfile.earlySignalRatio,
    failureValue: failureProfile.earlySignalRatio,
    ...computeDiff(successProfile.earlySignalRatio, failureProfile.earlySignalRatio),
  });

  diffs.push({
    feature: "Late Signals Ratio",
    successValue: successProfile.lateSignalRatio,
    failureValue: failureProfile.lateSignalRatio,
    ...computeDiff(successProfile.lateSignalRatio, failureProfile.lateSignalRatio),
  });

  // Signal type ratios
  const allTypes = new Set([
    ...Object.keys(successProfile.signalTypeRatios),
    ...Object.keys(failureProfile.signalTypeRatios),
  ]);

  for (const type of allTypes) {
    const successRatio = successProfile.signalTypeRatios[type] || 0;
    const failureRatio = failureProfile.signalTypeRatios[type] || 0;

    diffs.push({
      feature: `${type} Ratio`,
      successValue: successRatio,
      failureValue: failureRatio,
      ...computeDiff(successRatio, failureRatio),
    });
  }

  // Sort by significance
  return diffs.sort((a, b) => b.significance - a.significance);
}

/**
 * Compute difference metrics
 */
function computeDiff(
  successValue: number,
  failureValue: number,
  lowerIsBetter = false
): Pick<Differentiator, "absoluteDiff" | "percentDiff" | "significance"> {
  const absoluteDiff = Math.abs(successValue - failureValue);
  const avgValue = (successValue + failureValue) / 2;
  const percentDiff = avgValue > 0 ? (absoluteDiff / avgValue) * 100 : 0;

  // Significance: larger differences = more important
  // Normalize to 0-1 scale
  const significance = Math.min(percentDiff / 100, 1);

  return { absoluteDiff, percentDiff, significance };
}

/**
 * Empty comparison for insufficient data
 */
function emptyComparison(): ComparisonResult {
  return {
    successCount: 0,
    failureCount: 0,
    differentiators: [],
    successProfile: emptyProfile(),
    failureProfile: emptyProfile(),
  };
}

function emptyProfile(): FeatureProfile {
  return {
    avgSignalCount: 0,
    avgSignalDensity: 0,
    signalTypeRatios: {},
    avgFirstSignalTime: 0,
    avgConfidence: 0,
    earlySignalRatio: 0,
    midSignalRatio: 0,
    lateSignalRatio: 0,
    topSequences: [],
  };
}

// ==================== V3 COMPARISON ====================

/**
 * Compare v3 aggregates using decision-grade metrics
 * Uses Cohen's d for effect size instead of naive percent diff
 */
export function compareOutcomesV3(
  successAggregates: AggregateFeaturesV3[],
  failureAggregates: AggregateFeaturesV3[]
): ComparisonResultV3 {
  if (successAggregates.length === 0 || failureAggregates.length === 0) {
    return emptyComparisonV3();
  }

  const successProfile = computeProfileV3(successAggregates);
  const failureProfile = computeProfileV3(failureAggregates);

  const differentiators = computeDifferentiatorsV3(
    successProfile,
    failureProfile,
    successAggregates,
    failureAggregates
  );

  return {
    successCount: successAggregates.length,
    failureCount: failureAggregates.length,
    differentiators,
    successProfile,
    failureProfile,
    schemaVersion: 3,
  };
}

/**
 * Compute v3 profile for a group of calls
 */
function computeProfileV3(aggregates: AggregateFeaturesV3[]): FeatureProfileV3 {
  const count = aggregates.length;

  // Constraints
  const avg_constraints_per_call =
    aggregates.reduce((sum, a) => sum + a.constraints_per_call, 0) / count;

  const timeToFirstConstraints = aggregates
    .map((a) => a.time_to_first_constraint)
    .filter((t): t is number => t !== null);
  const avg_time_to_first_constraint =
    timeToFirstConstraints.length > 0
      ? timeToFirstConstraints.reduce((sum, t) => sum + t, 0) / timeToFirstConstraints.length
      : null;

  const avg_constraint_severity =
    aggregates.reduce((sum, a) => sum + a.avg_constraint_severity, 0) / count;

  const explicit_constraint_ratio =
    aggregates.reduce((sum, a) => sum + a.explicit_constraint_ratio, 0) / count;

  // Constraint types
  const allConstraintTypes: Record<string, number> = {};
  for (const agg of aggregates) {
    const constraintCounts = agg.constraint_type_counts ?? {};
    for (const [type, count] of Object.entries(constraintCounts)) {
      allConstraintTypes[type] = (allConstraintTypes[type] || 0) + count;
    }
  }
  const totalConstraints = Object.values(allConstraintTypes).reduce((sum, c) => sum + c, 0);
  const constraint_type_distribution: Record<string, number> = {};
  for (const [type, count] of Object.entries(allConstraintTypes)) {
    constraint_type_distribution[type] = totalConstraints > 0 ? count / totalConstraints : 0;
  }

  // Resolution
  const resolutionLatencies = aggregates
    .map((a) => a.avg_resolution_latency)
    .filter((l): l is number => l !== null);
  const avg_resolution_latency =
    resolutionLatencies.length > 0
      ? resolutionLatencies.reduce((sum, l) => sum + l, 0) / resolutionLatencies.length
      : null;

  const avg_unresolved_constraints =
    aggregates.reduce((sum, a) => sum + a.unresolved_constraint_count, 0) / count;

  // Strategy usage
  const allStrategies: Record<string, number> = {};
  for (const agg of aggregates) {
    const strategyCounts = agg.agent_strategy_count_by_type ?? {};
    for (const [strategy, count] of Object.entries(strategyCounts)) {
      allStrategies[strategy] = (allStrategies[strategy] || 0) + count;
    }
  }
  const totalStrategies = Object.values(allStrategies).reduce((sum, c) => sum + c, 0);
  const strategy_usage: Record<string, number> = {};
  for (const [strategy, count] of Object.entries(allStrategies)) {
    strategy_usage[strategy] = totalStrategies > 0 ? count / totalStrategies : 0;
  }

  // Control
  const control_shift_rate =
    aggregates.reduce((sum, a) => sum + a.control_shifts, 0) / count;

  const control_recovery_rate =
    aggregates.reduce((sum, a) => sum + a.control_recoveries, 0) / count;

  const control_recovery_before_commitment_rate =
    aggregates.filter((a) => a.control_recovery_before_commitment).length / count;

  const agent_control_ratio =
    aggregates.reduce((sum, a) => sum + a.agent_control_ratio, 0) / count;

  // Commitments
  const commitment_after_unresolved_rate =
    aggregates.filter((a) => a.commitment_after_unresolved_constraint).length / count;

  return {
    avg_constraints_per_call,
    avg_resolution_latency,
    control_recovery_before_commitment_rate,
    commitment_after_unresolved_rate,
    avg_time_to_first_constraint,
    avg_constraint_severity,
    explicit_constraint_ratio,
    constraint_type_distribution,
    strategy_usage,
    avg_unresolved_constraints,
    control_shift_rate,
    control_recovery_rate,
    agent_control_ratio,
  };
}

/**
 * Compute v3 differentiators using Cohen's d for effect size
 */
function computeDifferentiatorsV3(
  successProfile: FeatureProfileV3,
  failureProfile: FeatureProfileV3,
  successAggregates: AggregateFeaturesV3[],
  failureAggregates: AggregateFeaturesV3[]
): Differentiator[] {
  const diffs: Differentiator[] = [];

  // Helper to extract feature values
  const getFeatureValues = (
    aggs: AggregateFeaturesV3[],
    extractor: (a: AggregateFeaturesV3) => number | null
  ): number[] => {
    return aggs.map(extractor).filter((v): v is number => v !== null);
  };

  // Resolution latency (lower is better)
  const successLatencies = getFeatureValues(aggs => aggs, (a) => a.avg_resolution_latency);
  const failureLatencies = getFeatureValues(aggs => aggs, (a) => a.avg_resolution_latency);
  if (successLatencies.length > 0 && failureLatencies.length > 0) {
    diffs.push({
      feature: "Avg Resolution Latency (seconds)",
      successValue: successProfile.avg_resolution_latency || 0,
      failureValue: failureProfile.avg_resolution_latency || 0,
      ...computeDiffWithCohensD(successLatencies, failureLatencies, true),
    });
  }

  // Control recovery before commitment (higher is better)
  diffs.push({
    feature: "Control Recovery Before Commitment Rate",
    successValue: successProfile.control_recovery_before_commitment_rate,
    failureValue: failureProfile.control_recovery_before_commitment_rate,
    ...computeDiff(
      successProfile.control_recovery_before_commitment_rate,
      failureProfile.control_recovery_before_commitment_rate
    ),
  });

  // Commitment after unresolved (lower is better — RED FLAG)
  diffs.push({
    feature: "Commitment After Unresolved Rate (RED FLAG)",
    successValue: successProfile.commitment_after_unresolved_rate,
    failureValue: failureProfile.commitment_after_unresolved_rate,
    ...computeDiff(
      successProfile.commitment_after_unresolved_rate,
      failureProfile.commitment_after_unresolved_rate,
      true // Lower is better
    ),
  });

  // Constraints per call
  const successConstraints = successAggregates.map((a) => a.constraints_per_call);
  const failureConstraints = failureAggregates.map((a) => a.constraints_per_call);
  diffs.push({
    feature: "Constraints Per Call",
    successValue: successProfile.avg_constraints_per_call,
    failureValue: failureProfile.avg_constraints_per_call,
    ...computeDiffWithCohensD(successConstraints, failureConstraints),
  });

  // Time to first constraint
  const successTimeToFirst = getFeatureValues(successAggregates, (a) => a.time_to_first_constraint);
  const failureTimeToFirst = getFeatureValues(failureAggregates, (a) => a.time_to_first_constraint);
  if (successTimeToFirst.length > 0 && failureTimeToFirst.length > 0) {
    diffs.push({
      feature: "Time to First Constraint (seconds)",
      successValue: successProfile.avg_time_to_first_constraint || 0,
      failureValue: failureProfile.avg_time_to_first_constraint || 0,
      ...computeDiffWithCohensD(successTimeToFirst, failureTimeToFirst),
    });
  }

  // Constraint severity
  const successSeverities = successAggregates.map((a) => a.avg_constraint_severity);
  const failureSeverities = failureAggregates.map((a) => a.avg_constraint_severity);
  diffs.push({
    feature: "Avg Constraint Severity",
    successValue: successProfile.avg_constraint_severity,
    failureValue: failureProfile.avg_constraint_severity,
    ...computeDiffWithCohensD(successSeverities, failureSeverities),
  });

  // Unresolved constraints (lower is better)
  const successUnresolved = successAggregates.map((a) => a.unresolved_constraint_count);
  const failureUnresolved = failureAggregates.map((a) => a.unresolved_constraint_count);
  diffs.push({
    feature: "Unresolved Constraints",
    successValue: successProfile.avg_unresolved_constraints,
    failureValue: failureProfile.avg_unresolved_constraints,
    ...computeDiffWithCohensD(successUnresolved, failureUnresolved, true),
  });

  // Strategy usage rates
  const allStrategies = new Set([
    ...Object.keys(successProfile.strategy_usage),
    ...Object.keys(failureProfile.strategy_usage),
  ]);

  for (const strategy of allStrategies) {
    const successRate = successProfile.strategy_usage[strategy] || 0;
    const failureRate = failureProfile.strategy_usage[strategy] || 0;

    diffs.push({
      feature: `Strategy: ${strategy.replace(/_/g, " ")}`,
      successValue: successRate,
      failureValue: failureRate,
      ...computeDiff(successRate, failureRate),
    });
  }

  // Control metrics
  diffs.push({
    feature: "Control Recovery Rate",
    successValue: successProfile.control_recovery_rate,
    failureValue: failureProfile.control_recovery_rate,
    ...computeDiff(successProfile.control_recovery_rate, failureProfile.control_recovery_rate),
  });

  diffs.push({
    feature: "Agent Control Ratio",
    successValue: successProfile.agent_control_ratio,
    failureValue: failureProfile.agent_control_ratio,
    ...computeDiff(successProfile.agent_control_ratio, failureProfile.agent_control_ratio),
  });

  // Sort by significance
  return diffs.sort((a, b) => b.significance - a.significance);
}

/**
 * Compute difference with Cohen's d effect size
 */
function computeDiffWithCohensD(
  successValues: number[],
  failureValues: number[],
  lowerIsBetter = false
): Pick<Differentiator, "absoluteDiff" | "percentDiff" | "significance"> {
  const successMean = successValues.reduce((sum, v) => sum + v, 0) / successValues.length;
  const failureMean = failureValues.reduce((sum, v) => sum + v, 0) / failureValues.length;

  const absoluteDiff = Math.abs(successMean - failureMean);
  const avgValue = (successMean + failureMean) / 2;
  const percentDiff = avgValue > 0 ? (absoluteDiff / avgValue) * 100 : 0;

  // Cohen's d: (mean1 - mean2) / pooled_std_dev
  const successVariance =
    successValues.reduce((sum, v) => sum + Math.pow(v - successMean, 2), 0) / successValues.length;
  const failureVariance =
    failureValues.reduce((sum, v) => sum + Math.pow(v - failureMean, 2), 0) / failureValues.length;

  const pooledStdDev = Math.sqrt((successVariance + failureVariance) / 2);
  const cohensD = pooledStdDev > 0 ? Math.abs(successMean - failureMean) / pooledStdDev : 0;

  // Significance based on Cohen's d (0.2=small, 0.5=medium, 0.8=large)
  // Map to 0-1 scale
  const significance = Math.min(cohensD / 0.8, 1);

  return { absoluteDiff, percentDiff, significance };
}

/**
 * Empty v3 comparison
 */
function emptyComparisonV3(): ComparisonResultV3 {
  return {
    successCount: 0,
    failureCount: 0,
    differentiators: [],
    successProfile: emptyProfileV3(),
    failureProfile: emptyProfileV3(),
    schemaVersion: 3,
  };
}

function emptyProfileV3(): FeatureProfileV3 {
  return {
    avg_constraints_per_call: 0,
    avg_resolution_latency: null,
    control_recovery_before_commitment_rate: 0,
    commitment_after_unresolved_rate: 0,
    avg_time_to_first_constraint: null,
    avg_constraint_severity: 0,
    explicit_constraint_ratio: 0,
    constraint_type_distribution: {},
    strategy_usage: {},
    avg_unresolved_constraints: 0,
    control_shift_rate: 0,
    control_recovery_rate: 0,
    agent_control_ratio: 0,
  };
}

// ==================== SUCCESS-ONLY INSIGHTS ====================

/**
 * Generate actionable insights from success calls only
 * Used when no failure calls are available for comparison
 */
export interface SuccessInsights {
  callCount: number;
  avgConstraintsPerCall: number;
  avgResolutionLatency: number | null;
  constraintTypeDistribution: Record<string, number>;
  strategyUsage: Record<string, number>;
  controlRecoveryRate: number;
  avgConstraintSeverity: number;
  topPatterns: Array<{ pattern: string; frequency: number }>;
  timeToFirstConstraint: number | null;
  commitmentTypes: Record<string, number>;
  explicitConstraintRatio: number;
  avgUnresolvedConstraints: number;
  controlRecoveryBeforeCommitmentRate: number;
}

/**
 * Generate insights from success calls only
 * Returns actionable patterns and benchmarks
 */
export function generateSuccessInsights(
  successAggregates: AggregateFeaturesV3[]
): SuccessInsights {
  if (successAggregates.length === 0) {
    return emptySuccessInsights();
  }

  const profile = computeProfileV3(successAggregates);
  const count = successAggregates.length;

  // Identify top constraint patterns
  const constraintPatterns: Record<string, number> = {};
  for (const agg of successAggregates) {
    // Count common constraint sequences
    const types = Object.keys(agg.constraint_type_counts ?? {});
    if (types.length > 0) {
      const pattern = types.sort().join(" → ");
      constraintPatterns[pattern] = (constraintPatterns[pattern] || 0) + 1;
    }
  }

  const topPatterns = Object.entries(constraintPatterns)
    .map(([pattern, frequency]) => ({ pattern, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // Commitment types (placeholder - would need commitment marker data)
  const commitmentTypes: Record<string, number> = {};

  return {
    callCount: count,
    avgConstraintsPerCall: profile.avg_constraints_per_call,
    avgResolutionLatency: profile.avg_resolution_latency,
    constraintTypeDistribution: profile.constraint_type_distribution,
    strategyUsage: profile.strategy_usage,
    controlRecoveryRate: profile.control_recovery_rate,
    avgConstraintSeverity: profile.avg_constraint_severity,
    topPatterns,
    timeToFirstConstraint: profile.avg_time_to_first_constraint,
    commitmentTypes,
    explicitConstraintRatio: profile.explicit_constraint_ratio,
    avgUnresolvedConstraints: profile.avg_unresolved_constraints,
    controlRecoveryBeforeCommitmentRate: profile.control_recovery_before_commitment_rate,
  };
}

function emptySuccessInsights(): SuccessInsights {
  return {
    callCount: 0,
    avgConstraintsPerCall: 0,
    avgResolutionLatency: null,
    constraintTypeDistribution: {},
    strategyUsage: {},
    controlRecoveryRate: 0,
    avgConstraintSeverity: 0,
    topPatterns: [],
    timeToFirstConstraint: null,
    commitmentTypes: {},
    explicitConstraintRatio: 0,
    avgUnresolvedConstraints: 0,
    controlRecoveryBeforeCommitmentRate: 0,
  };
}
