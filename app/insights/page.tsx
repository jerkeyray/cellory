import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { compareOutcomes, generateSuccessInsights } from "@/app/lib/comparator";
import { AggregateFeatures } from "@/app/lib/aggregator";
import { AggregateFeaturesV3 } from "@/app/lib/aggregator-v3";
import { redirect } from "next/navigation";
import StatsCard from "./StatsCard";
import MarkerDistribution from "./MarkerDistribution";

interface Differentiator {
  feature: string;
  successValue: number;
  failureValue: number;
  absoluteDiff: number;
  percentDiff: number;
  significance: number;
}

interface FeatureProfile {
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

interface ComparisonResult {
  successCount: number;
  failureCount: number;
  differentiators: Differentiator[];
  successProfile: FeatureProfile;
  failureProfile: FeatureProfile;
}

function formatValue(value: number, feature: string) {
  if (feature.includes("Ratio") || feature.includes("Rate")) {
    return (value * 100).toFixed(1) + "%";
  }
  if (feature.includes("Time") || feature.includes("Latency") || feature.includes("seconds")) {
    if (feature.includes("seconds") && !feature.includes("Time")) {
      return value.toFixed(1) + "s";
    }
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  if (feature.includes("Constraints") || feature.includes("Severity") || feature.includes("Unresolved")) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const calls = await prisma.call.findMany({
    where: { status: "complete", userId: session.user.id },
    include: {
      transcript: {
        select: {
          durationSeconds: true,
          qualityScore: true,
          audioFormat: true,
          speechRatio: true,
          avgConfidence: true,
          nluResults: true,
        },
      },
      signals: true,
      aggregates: {
        select: { features: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCalls = calls.length;
  const successCallsCount = calls.filter((c) => c.outcome === "success").length;
  const failureCallsCount = calls.filter((c) => c.outcome === "failure").length;
  const successRate = totalCalls > 0 ? (successCallsCount / totalCalls) * 100 : 0;

  // Average resolution latency
  const callsWithLatency = calls.filter((c) => {
    const agg = c.aggregates[0]?.features as any;
    return agg?.avg_resolution_latency !== null && agg?.avg_resolution_latency !== undefined;
  });
  const avgResolutionLatency =
    callsWithLatency.length > 0
      ? callsWithLatency.reduce((sum, c) => {
          const agg = c.aggregates[0].features as any;
          return sum + agg.avg_resolution_latency;
        }, 0) / callsWithLatency.length
      : null;

  // Audio quality metrics
  const callsWithQuality = calls.filter((c) => c.transcript.qualityScore !== null);
  const avgQualityScore =
    callsWithQuality.length > 0
      ? callsWithQuality.reduce((sum, c) => sum + (c.transcript.qualityScore || 0), 0) / callsWithQuality.length
      : null;

  // Quality distribution
  const qualityDistribution = {
    high: callsWithQuality.filter((c) => (c.transcript.qualityScore || 0) >= 0.7).length,
    medium: callsWithQuality.filter((c) => (c.transcript.qualityScore || 0) >= 0.4 && (c.transcript.qualityScore || 0) < 0.7).length,
    low: callsWithQuality.filter((c) => (c.transcript.qualityScore || 0) < 0.4).length,
  };

  // Average duration
  const callsWithDuration = calls.filter((c) => c.transcript.durationSeconds !== null);
  const avgDuration =
    callsWithDuration.length > 0
      ? callsWithDuration.reduce((sum, c) => sum + (c.transcript.durationSeconds || 0), 0) / callsWithDuration.length
      : null;

  // NLU insights
  const callsWithNLU = calls.filter((c) => c.transcript.nluResults !== null);
  let totalObligations = 0;
  let obligationsWithDeadlines = 0;
  let regulatoryCompliantCalls = 0;
  const intentCounts: Record<string, number> = {};

  callsWithNLU.forEach((call) => {
    const nlu = call.transcript.nluResults as any;
    if (nlu) {
      totalObligations += nlu.obligations?.length || 0;
      obligationsWithDeadlines += nlu.obligations?.filter((o: any) => o.deadline).length || 0;

      // Check regulatory compliance (mini_miranda, fdcpa_disclosure, recording_notice)
      const hasCompliance = nlu.regulatory_phrases?.some((p: any) =>
        ['mini_miranda', 'fdcpa_disclosure', 'recording_notice'].includes(p.regulation_type) && p.present
      );
      if (hasCompliance) regulatoryCompliantCalls++;

      // Count intents
      nlu.intents?.forEach((intent: any) => {
        intentCounts[intent.intent] = (intentCounts[intent.intent] || 0) + 1;
      });
    }
  });

  const regulatoryComplianceRate = callsWithNLU.length > 0 ? (regulatoryCompliantCalls / callsWithNLU.length) * 100 : null;
  const avgObligationsPerCall = callsWithNLU.length > 0 ? totalObligations / callsWithNLU.length : null;

  const markerCounts: Record<string, number> = {};
  calls.forEach((call) => {
    call.signals.forEach((signal: any) => {
      markerCounts[signal.signalType] = (markerCounts[signal.signalType] || 0) + 1;
    });
  });

  // Fetch comparison data server-side
  // Get only aggregate features for successful calls
  const successCalls = await prisma.call.findMany({
    where: {
      userId: session.user.id,
      outcome: "success",
      status: "complete",
      aggregates: { some: {} }, // Only calls with aggregates
    },
    select: {
      aggregates: {
        select: { features: true },
        take: 1,
      },
    },
  });

  // Get only aggregate features for failed calls
  const failureCalls = await prisma.call.findMany({
    where: {
      userId: session.user.id,
      outcome: "failure",
      status: "complete",
      aggregates: { some: {} }, // Only calls with aggregates
    },
    select: {
      aggregates: {
        select: { features: true },
        take: 1,
      },
    },
  });

  // Extract features from the optimized query results
  const successAggregates: AggregateFeatures[] = successCalls.map(
    (call) => call.aggregates[0].features as unknown as AggregateFeatures
  );

  const failureAggregates: AggregateFeatures[] = failureCalls.map(
    (call) => call.aggregates[0].features as unknown as AggregateFeatures
  );

  // Determine mode: comparison or success-only insights
  const hasSuccessData = successAggregates.length > 0;
  const hasFailureData = failureAggregates.length > 0;
  const isSuccessOnlyMode = hasSuccessData && !hasFailureData;

  // Run comparison or generate success insights
  const comparison = hasSuccessData && hasFailureData
    ? compareOutcomes(successAggregates, failureAggregates)
    : null;

  // Generate success-only insights if no failure data
  const successInsights = isSuccessOnlyMode
    ? generateSuccessInsights(successAggregates as unknown as AggregateFeaturesV3[])
    : null;

  const insufficient = !hasSuccessData;

  // Check if this is a v3 comparison
  const isV3 = comparison ? (comparison as any).schemaVersion === 3 : true;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Insights
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Performance trends and outcome patterns from your calls
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Calls" value={totalCalls.toString()} />
          <StatsCard title="Success Rate" value={`${successRate.toFixed(1)}%`} />
          <StatsCard
            title="Avg Quality Score"
            value={avgQualityScore !== null ? `${(avgQualityScore * 100).toFixed(0)}%` : "—"}
          />
          <StatsCard
            title="Avg Duration"
            value={avgDuration !== null ? `${Math.floor(avgDuration / 60)}:${(Math.floor(avgDuration) % 60).toString().padStart(2, '0')}` : "—"}
          />
        </div>

        {/* Intelligence Metrics */}
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Intelligence Metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Avg Resolution Latency"
              value={avgResolutionLatency !== null ? `${avgResolutionLatency.toFixed(1)}s` : "—"}
            />
            <StatsCard
              title="Regulatory Compliance"
              value={regulatoryComplianceRate !== null ? `${regulatoryComplianceRate.toFixed(0)}%` : "—"}
            />
            <StatsCard
              title="Avg Obligations/Call"
              value={avgObligationsPerCall !== null ? avgObligationsPerCall.toFixed(1) : "—"}
            />
            <StatsCard
              title="Total Markers"
              value={calls.reduce((sum, c) => sum + c.signals.length, 0).toString()}
            />
          </div>
        </div>

        {/* Insights Grid */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Marker Distribution */}
          <MarkerDistribution data={markerCounts} />

          {/* Top Intents */}
          {Object.keys(intentCounts).length > 0 && (
            <div className="rounded-xl border border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Top Customer Intents
              </h3>
              <div className="space-y-3">
                {Object.entries(intentCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([intent, count]) => (
                    <div key={intent} className="flex items-center gap-3">
                      <div className="w-40 text-sm text-muted-foreground">
                        {intent.replace(/_/g, " ")}
                      </div>
                      <div className="flex-1">
                        <div className="h-6 rounded-full bg-gray-100">
                          <div
                            className="h-6 rounded-full bg-purple-500"
                            style={{
                              width: `${(count / Math.max(...Object.values(intentCounts))) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-medium text-foreground">
                        {count}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Audio Quality Insights */}
        {callsWithQuality.length > 0 && (
          <div className="mb-10 grid gap-6 lg:grid-cols-2">
            {/* Quality Distribution */}
            <div className="rounded-xl border border bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Audio Quality Distribution
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm text-muted-foreground">High Quality (≥70%)</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {qualityDistribution.high}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-sm text-muted-foreground">Medium Quality (40-70%)</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {qualityDistribution.medium}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Low Quality (&lt;40%)</span>
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {qualityDistribution.low}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground">Average Quality Score</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">
                    {(avgQualityScore! * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {insufficient ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <p className="text-sm text-yellow-800">
              No calls analyzed yet. Upload call transcripts to get started.
            </p>
            <Link
              href="/calls/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
            >
              Analyze Calls
            </Link>
          </div>
        ) : (
          <>
            {/* Outcome Comparison */}
            <div className="mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Outcome Comparison
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Statistical comparison of success vs. failure calls
              </p>
            </div>

            {/* Comparison Stats */}
            <div className="mb-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border bg-white p-6">
                <div className="text-sm text-muted-foreground">
                  Success Calls
                </div>
                <div className="mt-2 text-3xl font-bold text-green-600">
                  {isSuccessOnlyMode
                    ? successInsights!.callCount
                    : comparison!.successCount}
                </div>
              </div>
              <div className="rounded-xl border border bg-white p-6">
                <div className="text-sm text-muted-foreground">
                  Failure Calls
                </div>
                <div className="mt-2 text-3xl font-bold text-red-600">
                  {isSuccessOnlyMode ? 0 : comparison!.failureCount}
                </div>
              </div>
            </div>

            {isSuccessOnlyMode ? (
          <>
            {/* Success-Only Insights */}
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Success Insights Mode:</strong> Showing patterns from successful calls only.
                Add failure calls to unlock comparative analysis and identify what specifically differentiates success from failure.
              </p>
            </div>

            {/* Success Benchmarks */}
            <div className="mb-8 rounded-xl border border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Success Benchmarks
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Key metrics from {successInsights!.callCount} successful {successInsights!.callCount === 1 ? 'call' : 'calls'}
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Avg Constraints Per Call
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {successInsights!.avgConstraintsPerCall.toFixed(1)}
                  </div>
                </div>

                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Avg Resolution Latency
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {successInsights!.avgResolutionLatency !== null
                      ? `${successInsights!.avgResolutionLatency.toFixed(1)}s`
                      : "N/A"}
                  </div>
                </div>

                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Control Recovery Rate
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {(successInsights!.controlRecoveryRate * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Time to First Constraint
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {successInsights!.timeToFirstConstraint !== null
                      ? `${successInsights!.timeToFirstConstraint.toFixed(1)}s`
                      : "N/A"}
                  </div>
                </div>

                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Avg Constraint Severity
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {(successInsights!.avgConstraintSeverity * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-lg border border p-4">
                  <div className="text-xs text-muted-foreground">
                    Unresolved Constraints
                  </div>
                  <div className="mt-2 text-2xl font-bold text-green-600">
                    {successInsights!.avgUnresolvedConstraints.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Constraint Type Distribution */}
            {Object.keys(successInsights!.constraintTypeDistribution).length > 0 && (
              <div className="mb-8 rounded-xl border border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Constraint Type Distribution
                </h2>
                <div className="space-y-3">
                  {Object.entries(successInsights!.constraintTypeDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, ratio]) => (
                      <div key={type} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-muted-foreground">
                          {type}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 rounded-full bg-[#f5f5f5]">
                            <div
                              className="h-6 rounded-full bg-green-500"
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium text-foreground">
                          {(ratio * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Strategy Usage */}
            {Object.keys(successInsights!.strategyUsage).length > 0 && (
              <div className="mb-8 rounded-xl border border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Strategy Usage
                </h2>
                <div className="space-y-3">
                  {Object.entries(successInsights!.strategyUsage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([strategy, ratio]) => (
                      <div key={strategy} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-muted-foreground">
                          {strategy.replace(/_/g, " ")}
                        </div>
                        <div className="flex-1">
                          <div className="h-6 rounded-full bg-[#f5f5f5]">
                            <div
                              className="h-6 rounded-full bg-blue-500"
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-medium text-foreground">
                          {(ratio * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top Patterns */}
            {successInsights!.topPatterns.length > 0 && (
              <div className="rounded-xl border border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Common Constraint Patterns
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Most frequent constraint sequences in successful calls
                </p>
                <div className="space-y-2">
                  {successInsights!.topPatterns.map((pattern, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border p-3"
                    >
                      <span className="text-sm text-foreground">
                        {pattern.pattern}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pattern.frequency}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Key Differentiators */}
            <div className="mb-8 rounded-xl border border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Key Differentiators
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Features ranked by statistical significance
              </p>

              <div className="space-y-4">
                {comparison?.differentiators
                  .filter((d) => d.significance > 0.1)
                  .slice(0, 10)
                  .map((diff, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {diff.feature}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(diff.significance * 100).toFixed(0)}% significant
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Success
                          </div>
                          <div className="mt-1 font-medium text-green-600">
                            {formatValue(diff.successValue, diff.feature)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Failure
                          </div>
                          <div className="mt-1 font-medium text-red-600">
                            {formatValue(diff.failureValue, diff.feature)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Difference
                          </div>
                          <div className="mt-1 font-medium text-foreground">
                            {diff.percentDiff.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Side-by-Side Profiles */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Success Profile */}
              <div className="rounded-xl border border bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-green-600">
                  Success Profile {isV3 && <span className="text-xs text-muted-foreground">(v3)</span>}
                </h3>
                <dl className="space-y-3 text-sm">
                  {isV3 ? (
                    <>
                      {/* V3 Success Profile */}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Constraints / Call</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.successProfile as any).avg_constraints_per_call.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Resolution Latency</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.successProfile as any).avg_resolution_latency !== null
                            ? `${((comparison?.successProfile as any).avg_resolution_latency).toFixed(1)}s`
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Control Recovery Rate</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.successProfile as any).control_recovery_before_commitment_rate * 100).toFixed(0)}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Unresolved Constraints</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.successProfile as any).avg_unresolved_constraints.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Constraint Severity</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.successProfile as any).avg_constraint_severity * 100).toFixed(0)}%
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* V2 Success Profile */}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Avg Signals</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.successProfile as any).avgSignalCount.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Signal Density</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.successProfile as any).avgSignalDensity.toFixed(2)} / min
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Avg Confidence</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.successProfile as any).avgConfidence * 100).toFixed(0)}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Early Signals</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.successProfile as any).earlySignalRatio * 100).toFixed(0)}%
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>

              {/* Failure Profile */}
              <div className="rounded-xl border border bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold text-red-600">
                  Failure Profile {isV3 && <span className="text-xs text-muted-foreground">(v3)</span>}
                </h3>
                <dl className="space-y-3 text-sm">
                  {isV3 ? (
                    <>
                      {/* V3 Failure Profile */}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Constraints / Call</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.failureProfile as any).avg_constraints_per_call.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Resolution Latency</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.failureProfile as any).avg_resolution_latency !== null
                            ? `${((comparison?.failureProfile as any).avg_resolution_latency).toFixed(1)}s`
                            : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Control Recovery Rate</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.failureProfile as any).control_recovery_before_commitment_rate * 100).toFixed(0)}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Unresolved Constraints</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.failureProfile as any).avg_unresolved_constraints.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Constraint Severity</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.failureProfile as any).avg_constraint_severity * 100).toFixed(0)}%
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* V2 Failure Profile */}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Avg Signals</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.failureProfile as any).avgSignalCount.toFixed(1)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Signal Density</dt>
                        <dd className="font-medium text-foreground">
                          {(comparison?.failureProfile as any).avgSignalDensity.toFixed(2)} / min
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Avg Confidence</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.failureProfile as any).avgConfidence * 100).toFixed(0)}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Early Signals</dt>
                        <dd className="font-medium text-foreground">
                          {((comparison?.failureProfile as any).earlySignalRatio * 100).toFixed(0)}%
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
