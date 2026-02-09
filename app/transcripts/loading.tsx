export default function TranscriptsLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-9 w-48 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            <div className="mt-2 h-5 w-64 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-lg bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
        </div>

        {/* Stats Skeleton */}
        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border border-[#e5e5e5] bg-white dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="h-4 w-20 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr
                    key={i}
                    className="border-b border-[#e5e5e5] last:border-0 dark:border-[#2a2a2a]"
                  >
                    <td className="px-6 py-4">
                      <div className="h-5 w-48 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-16 animate-pulse rounded-full bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-12 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-24 animate-pulse rounded bg-[#e5e5e5] dark:bg-[#2a2a2a]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
