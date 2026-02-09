export default function CallDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Back Button Skeleton */}
        <div className="mb-8">
          <div className="h-5 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 w-64 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            <div className="mt-2 h-5 w-48 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-full bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-[#e5e5e5] p-4 dark:border-[#2a2a2a]"
            >
              <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
              <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6 flex gap-2 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-28 animate-pulse rounded-t bg-[#e5e5e5] dark:bg-[#2a2a2a]"
            />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 w-12 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                <div className="h-5 flex-1 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
