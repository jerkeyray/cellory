import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { compareOutcomes } from "@/app/lib/comparator";
import { AggregateFeatures } from "@/app/lib/aggregator";

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
  if (feature.includes("Ratio")) {
    return (value * 100).toFixed(1) + "%";
  }
  if (feature.includes("Time")) {
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  return value.toFixed(2);
}

export default async function ComparePage() {
  // Fetch comparison data server-side
  // Get only aggregate features for successful calls
  const successCalls = await prisma.call.findMany({
    where: {
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

  // Run comparison server-side
  const comparison: ComparisonResult = compareOutcomes(
    successAggregates,
    failureAggregates
  );

  const insufficient =
    comparison.successCount === 0 || comparison.failureCount === 0;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a1a1a] dark:text-white">
            Outcome Comparison
          </h1>
          <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
            Statistical comparison of success vs. failure calls
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-sm text-[#666] dark:text-[#999]">
              Success Calls
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
              {comparison.successCount}
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
            <div className="text-sm text-[#666] dark:text-[#999]">
              Failure Calls
            </div>
            <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
              {comparison.failureCount}
            </div>
          </div>
        </div>

        {insufficient ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Need at least 1 success call and 1 failure call to generate
              meaningful comparisons.
            </p>
            <Link
              href="/calls/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b]"
            >
              Analyze More Calls
            </Link>
          </div>
        ) : (
          <>
            {/* Key Differentiators */}
            <div className="mb-8 rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Key Differentiators
              </h2>
              <p className="mb-4 text-sm text-[#666] dark:text-[#999]">
                Features ranked by statistical significance
              </p>

              <div className="space-y-4">
                {comparison.differentiators
                  .filter((d) => d.significance > 0.1)
                  .slice(0, 10)
                  .map((diff, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#e5e5e5] p-4 dark:border-[#2a2a2a]"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-[#1a1a1a] dark:text-white">
                          {diff.feature}
                        </span>
                        <span className="text-xs text-[#999]">
                          {(diff.significance * 100).toFixed(0)}% significant
                        </span>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <div className="text-xs text-[#666] dark:text-[#999]">
                            Success
                          </div>
                          <div className="mt-1 font-medium text-green-600 dark:text-green-400">
                            {formatValue(diff.successValue, diff.feature)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#666] dark:text-[#999]">
                            Failure
                          </div>
                          <div className="mt-1 font-medium text-red-600 dark:text-red-400">
                            {formatValue(diff.failureValue, diff.feature)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#666] dark:text-[#999]">
                            Difference
                          </div>
                          <div className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
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
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
                <h3 className="mb-4 text-lg font-semibold text-green-600 dark:text-green-400">
                  Success Profile
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Avg Signals</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {comparison.successProfile.avgSignalCount.toFixed(1)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">
                      Signal Density
                    </dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {comparison.successProfile.avgSignalDensity.toFixed(2)} / min
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Avg Confidence</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {(comparison.successProfile.avgConfidence * 100).toFixed(0)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Early Signals</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {(comparison.successProfile.earlySignalRatio * 100).toFixed(
                        0
                      )}
                      %
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Failure Profile */}
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
                <h3 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">
                  Failure Profile
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Avg Signals</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {comparison.failureProfile.avgSignalCount.toFixed(1)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">
                      Signal Density
                    </dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {comparison.failureProfile.avgSignalDensity.toFixed(2)} / min
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Avg Confidence</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {(comparison.failureProfile.avgConfidence * 100).toFixed(0)}%
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#666] dark:text-[#999]">Early Signals</dt>
                    <dd className="font-medium text-[#1a1a1a] dark:text-white">
                      {(comparison.failureProfile.earlySignalRatio * 100).toFixed(
                        0
                      )}
                      %
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
