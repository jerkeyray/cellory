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
    <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      <div className="text-sm text-[#666] dark:text-[#999]">{title}</div>
      <div className="mt-2 text-3xl font-bold text-[#1a1a1a] dark:text-white">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-[#666] dark:text-[#999]">
          {subtitle}
        </div>
      )}
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {trend > 0 ? (
            <span className="text-green-600 dark:text-green-400">↑</span>
          ) : trend < 0 ? (
            <span className="text-red-600 dark:text-red-400">↓</span>
          ) : (
            <span className="text-[#999]">→</span>
          )}
          <span
            className={`text-xs ${
              trend > 0
                ? "text-green-600 dark:text-green-400"
                : trend < 0
                ? "text-red-600 dark:text-red-400"
                : "text-[#999]"
            }`}
          >
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-[#666] dark:text-[#999]">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
