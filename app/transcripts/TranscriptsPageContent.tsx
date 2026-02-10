"use client";

import { useState } from "react";
import TranscriptsClient from "./TranscriptsClient";
import BatchAnalysisButton from "./BatchAnalysisButton";
import BulkUploadForm from "./BulkUploadForm";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { MusicNote01Icon } from "@hugeicons/core-free-icons";

interface Transcript {
  id: string;
  filename: string;
  status: "processing" | "ready" | "error";
  source: string;
  skipTranscription: boolean;
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

      {/* Upload Section */}
      <Card className="mb-6">
        <CardContent className="pt-5 pb-5">
          <BulkUploadForm />
        </CardContent>
      </Card>

      {/* Library Header */}
      {transcripts.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={MusicNote01Icon} className="h-4 w-4" />
          <span className="text-sm font-medium">Recording Library ({transcripts.length})</span>
        </div>
      )}

      <TranscriptsClient
        transcripts={transcripts}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </>
  );
}
