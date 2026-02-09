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
    <div className="rounded-xl border border bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">
        Marker Distribution (Top 10)
      </h2>

      {sortedMarkers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
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
                  <span className="font-medium text-foreground">
                    {type.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="font-medium text-foreground">
                      {count}
                    </span>
                  </div>
                </div>
                <div className="h-6 w-full rounded-full bg-[#f5f5f5]">
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
        <div className="mt-6 rounded-lg border border bg-[#f5f5f5] p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Total Markers
            </span>
            <span className="font-medium text-foreground">
              {totalMarkers}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-muted-foreground">
              Unique Types
            </span>
            <span className="font-medium text-foreground">
              {Object.keys(data).length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
