/**
 * Deterministic signal aggregation
 * ZERO LLM calls - 100% pure computation
 *
 * Cost discipline: This is free (no API calls)
 * We do ALL the heavy lifting here with math, not AI
 */

import { Signal } from "./signals";

export interface AggregateFeatures {
  // Signal counts
  signalCounts: Record<string, number>;
  totalSignals: number;

  // Timing features
  signalDensity: number; // signals per minute
  firstSignalTime: number | null; // when first signal appears
  lastSignalTime: number | null; // when last signal appears

  // Distribution across call
  earlyThirdSignals: number; // signals in first 33%
  midThirdSignals: number; // signals in middle 33%
  lateThirdSignals: number; // signals in last 33%

  // Confidence metrics
  avgConfidence: number;
  confidenceByType: Record<string, number>;

  // Sequence patterns (bigrams)
  signalSequences: Record<string, number>; // e.g., "objection→resolution_attempt": 3

  // Type-specific timing
  firstObjectionTime: number | null;
  firstAgreementTime: number | null;
  lastObjectionTime: number | null;
  lastAgreementTime: number | null;
}

/**
 * Aggregate signals into deterministic features
 * Pure computation, no randomness, fully auditable
 */
export function aggregateSignals(
  signals: Signal[],
  callDuration: number
): AggregateFeatures {
  if (signals.length === 0) {
    return emptyFeatures();
  }

  // Sort by start time
  const sorted = [...signals].sort((a, b) => a.startTime - b.startTime);

  // Count signals by type
  const signalCounts: Record<string, number> = {};
  for (const signal of signals) {
    signalCounts[signal.type] = (signalCounts[signal.type] || 0) + 1;
  }

  // Timing features
  const firstSignalTime = sorted[0].startTime;
  const lastSignalTime = sorted[sorted.length - 1].endTime;
  const signalDensity = callDuration > 0 ? (signals.length / callDuration) * 60 : 0;

  // Distribution across thirds
  const thirdDuration = callDuration / 3;
  const earlyThirdSignals = signals.filter((s) => s.startTime < thirdDuration).length;
  const midThirdSignals = signals.filter(
    (s) => s.startTime >= thirdDuration && s.startTime < thirdDuration * 2
  ).length;
  const lateThirdSignals = signals.filter((s) => s.startTime >= thirdDuration * 2).length;

  // Confidence metrics
  const avgConfidence =
    signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

  const confidenceByType: Record<string, number> = {};
  for (const type in signalCounts) {
    const typeSignals = signals.filter((s) => s.type === type);
    confidenceByType[type] =
      typeSignals.reduce((sum, s) => sum + s.confidence, 0) / typeSignals.length;
  }

  // Sequence patterns (bigrams)
  const signalSequences: Record<string, number> = {};
  for (let i = 0; i < sorted.length - 1; i++) {
    const seq = `${sorted[i].type}→${sorted[i + 1].type}`;
    signalSequences[seq] = (signalSequences[seq] || 0) + 1;
  }

  // Type-specific timing
  const objections = signals.filter((s) => s.type === "objection");
  const agreements = signals.filter((s) => s.type === "agreement");

  const firstObjectionTime =
    objections.length > 0
      ? Math.min(...objections.map((s) => s.startTime))
      : null;
  const lastObjectionTime =
    objections.length > 0
      ? Math.max(...objections.map((s) => s.endTime))
      : null;
  const firstAgreementTime =
    agreements.length > 0
      ? Math.min(...agreements.map((s) => s.startTime))
      : null;
  const lastAgreementTime =
    agreements.length > 0
      ? Math.max(...agreements.map((s) => s.endTime))
      : null;

  return {
    signalCounts,
    totalSignals: signals.length,
    signalDensity,
    firstSignalTime,
    lastSignalTime,
    earlyThirdSignals,
    midThirdSignals,
    lateThirdSignals,
    avgConfidence,
    confidenceByType,
    signalSequences,
    firstObjectionTime,
    lastObjectionTime,
    firstAgreementTime,
    lastAgreementTime,
  };
}

/**
 * Empty features for calls with no signals
 */
function emptyFeatures(): AggregateFeatures {
  return {
    signalCounts: {},
    totalSignals: 0,
    signalDensity: 0,
    firstSignalTime: null,
    lastSignalTime: null,
    earlyThirdSignals: 0,
    midThirdSignals: 0,
    lateThirdSignals: 0,
    avgConfidence: 0,
    confidenceByType: {},
    signalSequences: {},
    firstObjectionTime: null,
    lastObjectionTime: null,
    firstAgreementTime: null,
    lastAgreementTime: null,
  };
}
