import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CallDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* Info Grid Skeleton */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-6 w-16" />
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="mb-6 flex gap-2 border-b">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>

        {/* Content Skeleton */}
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
