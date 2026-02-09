import { Suspense } from "react";
import Link from "next/link";
import NewCallForm from "./NewCallForm";

export default function NewCallPage() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/calls"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-[#ff6b35]"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Calls
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-foreground">
            New Call Analysis
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI will analyze the transcript and automatically determine the outcome
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border bg-white p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
            </div>
          }>
            <NewCallForm />
          </Suspense>
        </div>

        {/* Info */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-sm font-medium text-blue-900">
            How It Works
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800">
            <li>• AI analyzes conversation and extracts behavioral signals</li>
            <li>• Automatically determines if the call was a success or failure</li>
            <li>• Feature aggregation for outcome comparison</li>
            <li>• Processing takes ~30s, results update in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
