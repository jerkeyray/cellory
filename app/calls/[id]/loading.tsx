import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CallDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" /> {/* Quality badge */}
            <Skeleton className="h-6 w-20 rounded-full" /> {/* Outcome badge */}
            <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diarization Timeline */}
            <Card className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </Card>

            {/* Agent Markers */}
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-lg border border bg-gray-50/50 p-3">
                    {/* Header Row: Badge + Time, Confidence */}
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-10" />
                    </div>
                    {/* Description */}
                    <Skeleton className="h-4 w-full mb-2" />
                    {/* Metadata row */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transcript */}
            <Card className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex gap-4 py-2">
                    <Skeleton className="flex-shrink-0 w-14 h-4" /> {/* Timestamp */}
                    <Skeleton className="flex-shrink-0 w-20 h-4" /> {/* Speaker */}
                    <Skeleton className="flex-1 h-4" /> {/* Text */}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <Card className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </Card>

            {/* NLU Insights Card */}
            <Card className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />

              {/* Intents */}
              <div className="mb-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>

              {/* Obligations */}
              <div className="mb-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Regulatory Compliance */}
              <div className="mb-4">
                <Skeleton className="h-4 w-40 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Entities */}
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <div className="space-y-1">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </Card>

            {/* Aggregates Card */}
            <Card className="p-6">
              <Skeleton className="h-6 w-28 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
