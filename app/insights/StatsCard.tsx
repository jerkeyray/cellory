interface StatsCardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  trend,
  trendLabel,
  subtitle,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border bg-white p-6">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-3xl font-bold text-foreground">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-muted-foreground">
          {subtitle}
        </div>
      )}
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {trend > 0 ? (
            <span className="text-green-600">↑</span>
          ) : trend < 0 ? (
            <span className="text-red-600">↓</span>
          ) : (
            <span className="text-muted-foreground">→</span>
          )}
          <span
            className={`text-xs ${
              trend > 0
                ? "text-green-600"
                : trend < 0
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
