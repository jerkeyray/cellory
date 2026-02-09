"use client";

interface MarkerDistributionProps {
  data: Record<string, number>;
}

export default function MarkerDistribution({ data }: MarkerDistributionProps) {
  // Sort by count descending and take top 10
  const sortedMarkers = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const totalMarkers = Object.values(data).reduce((sum, count) => sum + count, 0);
  const maxCount = sortedMarkers[0]?.[1] || 1;

  // Color mapping for marker types
  const getMarkerColor = (type: string) => {
    if (type.includes("constraint")) return "#ef4444"; // red
    if (type.includes("strategy") || type.includes("response")) return "#3b82f6"; // blue
    if (type.includes("control")) return "#8b5cf6"; // violet
    if (type.includes("commitment")) return "#10b981"; // green
    return "#6b7280"; // gray
  };

  return (
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      <h2 className="mb-6 text-lg font-semibold text-[#1a1a1a] dark:text-white">
        Marker Distribution (Top 10)
      </h2>

      {sortedMarkers.length === 0 ? (
        <p className="text-sm text-[#666] dark:text-[#999]">
          No markers detected yet
        </p>
      ) : (
        <div className="space-y-4">
          {sortedMarkers.map(([type, count]) => {
            const percentage = (count / totalMarkers) * 100;
            const barWidth = (count / maxCount) * 100;
            const color = getMarkerColor(type);

            return (
              <div key={type}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#1a1a1a] dark:text-white">
                    {type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#666] dark:text-[#999]">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="font-medium text-[#1a1a1a] dark:text-white">
                      {count}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-full rounded-full bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                  <div
                    className="h-6 rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {sortedMarkers.length > 0 && (
        <div className="mt-6 rounded-lg border border-[#e5e5e5] bg-[#f5f5f5] p-4 text-sm dark:border-[#2a2a2a] dark:bg-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <span className="text-[#666] dark:text-[#999]">
              Total Markers
            </span>
            <span className="font-medium text-[#1a1a1a] dark:text-white">
              {totalMarkers}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[#666] dark:text-[#999]">
              Unique Types
            </span>
            <span className="font-medium text-[#1a1a1a] dark:text-white">
              {Object.keys(data).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
