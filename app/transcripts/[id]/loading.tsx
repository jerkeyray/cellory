export default function TranscriptDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Back Button Skeleton */}
        <div className="mb-8">
          <div className="h-5 w-32 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-96 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          <div className="mt-4 flex gap-4">
            <div className="h-5 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            <div className="h-5 w-32 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            <div className="h-5 w-28 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-8 flex gap-3">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          <div className="h-10 w-32 animate-pulse rounded-lg bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
        </div>

        {/* Transcript Content Skeleton */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 w-12 flex-shrink-0 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-full animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  {i % 2 === 0 && (
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
