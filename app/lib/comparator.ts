/**
 * Deterministic outcome comparison
 * ZERO LLM calls - 100% pure statistics
 *
 * Cost discipline: This is free (no API calls)
 * We identify meaningful differences using pure math
 */

import { AggregateFeatures } from "./aggregator";

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

/**
 * Compare success vs failure calls
 * Pure computation: means, differences, rankings
 */
export function compareOutcomes(
  successAggregates: AggregateFeatures[],
  failureAggregates: AggregateFeatures[]
): ComparisonResult {
  if (successAggregates.length === 0 || failureAggregates.length === 0) {
    return emptyComparison();
  }

  const successProfile = computeProfile(successAggregates);
  const failureProfile = computeProfile(failureAggregates);

  const differentiators = computeDifferentiators(
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
