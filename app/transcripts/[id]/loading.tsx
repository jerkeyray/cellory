import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function TranscriptDetailLoading() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Back Button Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-8 space-y-4">
          <Skeleton className="h-8 w-96" />
          <div className="flex gap-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-8 flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Transcript Content Skeleton */}
        <Card className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-12 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  {i % 2 === 0 && <Skeleton className="h-5 w-3/4" />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
