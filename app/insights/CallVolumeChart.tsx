"use client";

interface CallVolumeChartProps {
  data: Record<string, { success: number; failure: number }>;
}

export default function CallVolumeChart({ data }: CallVolumeChartProps) {
  // Sort dates and get last 30 days
  const dates = Object.keys(data).sort();
  const last30Days = dates.slice(-30);

  // Find max value for scaling
  const maxValue = Math.max(
    ...last30Days.map((date) => data[date].success + data[date].failure),
    1
  );

  return (
    <div className="rounded-xl border border bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">
        Call Volume (Last 30 Days)
      </h2>

      {last30Days.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No data available
        </p>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-4 flex items-end justify-between gap-1" style={{ height: "200px" }}>
            {last30Days.map((date) => {
              const total = data[date].success + data[date].failure;
              const successHeight = (data[date].success / maxValue) * 100;
              const failureHeight = (data[date].failure / maxValue) * 100;

              return (
                <div
                  key={date}
                  className="group relative flex flex-1 flex-col justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg border border bg-white px-3 py-2 text-xs shadow-lg group-hover:block">
                    <div className="font-medium text-foreground">
                      {new Date(date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      <div className="text-green-600">
                        Success: {data[date].success}
                      </div>
                      <div className="text-red-600">
                        Failure: {data[date].failure}
                      </div>
                      <div className="mt-1 border-t border pt-1">
                        Total: {total}
                      </div>
                    </div>
                  </div>

                  {/* Stacked bar */}
                  <div className="flex flex-col gap-px">
                    {data[date].failure > 0 && (
                      <div
                        className="w-full rounded-t bg-red-500 transition-all hover:bg-red-600"
                        style={{ height: `${failureHeight}%` }}
                      />
                    )}
                    {data[date].success > 0 && (
                      <div
                        className={`w-full bg-green-500 transition-all hover:bg-green-600 ${
                          data[date].failure === 0 ? "rounded-t" : ""
                        }`}
                        style={{ height: `${successHeight}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-muted-foreground">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Failure</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
