"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GeneratePlaybookButtonProps {
  hasData: boolean;
}

export default function GeneratePlaybookButton({ hasData }: GeneratePlaybookButtonProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!hasData) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate playbook");
      }

      const playbook = await res.json();

      // Redirect to the new playbook
      router.push(`/playbooks/${playbook.id}`);
    } catch (err: any) {
      console.error("Error generating playbook:", err);
      setError(err.message || "Failed to generate playbook");
      setGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={!hasData || generating}
        className="inline-flex items-center gap-2 rounded-lg bg-[#ff6b35] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating Playbook...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Generate Playbook
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
