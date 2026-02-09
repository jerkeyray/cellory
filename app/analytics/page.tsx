import { prisma } from "@/app/lib/prisma";
import StatsCard from "./StatsCard";
import CallVolumeChart from "./CallVolumeChart";
import MarkerDistribution from "./MarkerDistribution";

export default async function AnalyticsPage() {
  // Fetch all complete calls with aggregates
  const calls = await prisma.call.findMany({
    where: { status: "complete" },
    include: {
      transcript: {
        select: {
          durationSeconds: true,
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

  // Calculate key metrics
  const totalCalls = calls.length;
  const successCalls = calls.filter((c) => c.outcome === "success").length;
  const failureCalls = calls.filter((c) => c.outcome === "failure").length;
  const successRate = totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0;

  // Calculate resolution latency (from v3 aggregates)
  const callsWithLatency = calls
    .filter((c) => {
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

  // Calculate calls this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const callsThisWeek = calls.filter((c) => new Date(c.createdAt) >= oneWeekAgo).length;

  // Group calls by date for volume chart
  const callsByDate: Record<string, { success: number; failure: number }> = {};
  calls.forEach((call) => {
    const date = new Date(call.createdAt).toISOString().split("T")[0];
    if (!callsByDate[date]) {
      callsByDate[date] = { success: 0, failure: 0 };
    }
    if (call.outcome === "success") {
      callsByDate[date].success++;
    } else {
      callsByDate[date].failure++;
    }
  });

  // Get marker distribution
  const markerCounts: Record<string, number> = {};
  calls.forEach((call) => {
    call.signals.forEach((signal: any) => {
      markerCounts[signal.signalType] = (markerCounts[signal.signalType] || 0) + 1;
    });
  });

  // Calculate trend (compare last 7 days vs previous 7 days)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const callsPreviousWeek = calls.filter(
    (c) => new Date(c.createdAt) >= twoWeeksAgo && new Date(c.createdAt) < oneWeekAgo
  ).length;
  const volumeTrend =
    callsPreviousWeek > 0
      ? ((callsThisWeek - callsPreviousWeek) / callsPreviousWeek) * 100
      : callsThisWeek > 0
      ? 100
      : 0;

  // Calculate success rate trend
  const successCallsThisWeek = calls.filter(
    (c) => c.outcome === "success" && new Date(c.createdAt) >= oneWeekAgo
  ).length;
  const successCallsPrevWeek = calls.filter(
    (c) =>
      c.outcome === "success" &&
      new Date(c.createdAt) >= twoWeeksAgo &&
      new Date(c.createdAt) < oneWeekAgo
  ).length;
  const totalCallsPrevWeek = calls.filter(
    (c) => new Date(c.createdAt) >= twoWeeksAgo && new Date(c.createdAt) < oneWeekAgo
  ).length;

  const successRateThisWeek = callsThisWeek > 0 ? (successCallsThisWeek / callsThisWeek) * 100 : 0;
  const successRatePrevWeek = totalCallsPrevWeek > 0 ? (successCallsPrevWeek / totalCallsPrevWeek) * 100 : 0;
  const successRateTrend = successRatePrevWeek > 0 ? successRateThisWeek - successRatePrevWeek : 0;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trends, patterns, and insights from your call analyses
          </p>
        </div>

        {/* Key Metrics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Calls"
            value={totalCalls.toString()}
            trend={volumeTrend}
            trendLabel="vs last week"
          />
          <StatsCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            trend={successRateTrend}
            trendLabel="vs last week"
          />
          <StatsCard
            title="Avg Resolution"
            value={
              avgResolutionLatency !== null
                ? `${avgResolutionLatency.toFixed(1)}s`
                : "N/A"
            }
            subtitle={callsWithLatency.length > 0 ? `${callsWithLatency.length} calls` : undefined}
          />
          <StatsCard
            title="This Week"
            value={callsThisWeek.toString()}
            subtitle={`${successCallsThisWeek} success / ${callsThisWeek - successCallsThisWeek} failure`}
          />
        </div>

        {/* Call Volume Chart */}
        <div className="mb-8">
          <CallVolumeChart data={callsByDate} />
        </div>

        {/* Marker Distribution */}
        <div className="mb-8">
          <MarkerDistribution data={markerCounts} />
        </div>

        {/* Top Insights */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Insights */}
          <div className="rounded-xl border border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Performance Insights
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">📊</span>
                <div>
                  <p className="font-medium text-foreground">
                    Success Rate: {successRate.toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">
                    {successCalls} successful out of {totalCalls} total calls
                  </p>
                </div>
              </div>
              {avgResolutionLatency !== null && (
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="font-medium text-foreground">
                      Average Resolution: {avgResolutionLatency.toFixed(1)}s
                    </p>
                    <p className="text-muted-foreground">
                      Based on {callsWithLatency.length} calls with resolution data
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <span className="text-lg">📈</span>
                <div>
                  <p className="font-medium text-foreground">
                    Weekly Activity: {callsThisWeek} calls
                  </p>
                  <p className="text-muted-foreground">
                    {volumeTrend > 0 ? "+" : ""}
                    {volumeTrend.toFixed(0)}% vs previous week
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/compare"
                className="block rounded-lg border border p-3 text-sm transition-colors hover:border-[#ff6b35] hover:bg-[#fff5f2]"
              >
                <p className="font-medium text-foreground">
                  Compare Outcomes
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Analyze success vs failure patterns
                </p>
              </a>
              <a
                href="/calls"
                className="block rounded-lg border border p-3 text-sm transition-colors hover:border-[#ff6b35] hover:bg-[#fff5f2]"
              >
                <p className="font-medium text-foreground">
                  View All Calls
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Search, filter, and manage calls
                </p>
              </a>
              <a
                href="/calls/new"
                className="block rounded-lg border border p-3 text-sm transition-colors hover:border-[#ff6b35] hover:bg-[#fff5f2]"
              >
                <p className="font-medium text-foreground">
                  Analyze New Call
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload a transcript to get started
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
