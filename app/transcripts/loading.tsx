import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function TranscriptsLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Bulk Upload Form Skeleton */}
        <Card className="mb-8 p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </Card>

        {/* Transcripts List Header */}
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>

        {/* Transcripts Table Skeleton */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-24" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-20" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-48" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3 rounded-full" /> {/* Quality dot */}
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
