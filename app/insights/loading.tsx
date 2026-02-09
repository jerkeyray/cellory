import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InsightsLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Key Metrics Skeleton */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Intelligence Metrics Skeleton */}
        <div className="mb-10">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))}
          </div>
        </div>

        {/* Insights Grid Skeleton */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Marker Distribution */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="flex-1 h-6 rounded-full" />
                  <Skeleton className="w-12 h-4" />
                </div>
              ))}
            </div>
          </div>

          {/* Top Intents */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-40 h-4" />
                  <Skeleton className="flex-1 h-6 rounded-full" />
                  <Skeleton className="w-12 h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audio Quality Insights Skeleton */}
        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          {/* Quality Distribution */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
              <div className="mt-4 pt-4 border-t">
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>

          {/* Audio Format Distribution */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="flex-1 h-6 rounded-full" />
                  <Skeleton className="w-16 h-4" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outcome Comparison Header Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Comparison Stats Skeleton */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-16" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-16" />
          </Card>
        </div>

        {/* Key Differentiators Skeleton */}
        <div className="mb-8 rounded-xl border border bg-white p-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profiles Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Success Profile */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Failure Profile */}
          <div className="rounded-xl border border bg-white p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
