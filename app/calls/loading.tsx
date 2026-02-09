import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CallsLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Stats Skeleton */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-8 w-12 mb-1" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <Card className="mb-6 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </Card>

        {/* Filter Tabs Skeleton */}
        <div className="mb-6 flex gap-2 border-b">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Call Cards Skeleton */}
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-64" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
