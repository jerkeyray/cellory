"use client";

import { useState } from "react";
import TranscriptsClient from "./TranscriptsClient";
import BatchAnalysisButton from "./BatchAnalysisButton";
import BulkUploadForm from "./BulkUploadForm";
import { PageHeader } from "@/components/page-header";

interface Transcript {
  id: string;
  filename: string;
  status: "processing" | "ready" | "error";
  durationSeconds: number | null;
  language: string | null;
  qualityScore: number | null;
  createdAt: string;
  mostRecentCallId: string | null;
  _count: {
    calls: number;
  };
}

interface TranscriptsPageContentProps {
  transcripts: Transcript[];
}

export default function TranscriptsPageContent({ transcripts }: TranscriptsPageContentProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const unanalyzedTranscripts = transcripts.filter(
    (t) => t.status === "ready" && t._count.calls === 0
  );

  const clearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <>
      <PageHeader
        title="Recordings"
        description="Upload and manage your call recordings"
        actions={
          unanalyzedTranscripts.length > 0 ? (
            <BatchAnalysisButton
              selectedIds={selectedIds}
              onClearSelection={clearSelection}
              totalUnanalyzed={unanalyzedTranscripts.length}
            />
          ) : undefined
        }
      />

      {/* Bulk Upload Form */}
      <div className="mb-8">
        <BulkUploadForm />
      </div>

      <TranscriptsClient
        transcripts={transcripts}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  );
}
