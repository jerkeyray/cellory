"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TranscriptUploadForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadedId, setUploadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for transcript completion and redirect with exponential backoff
  useEffect(() => {
    if (!uploadedId) return;

    let pollCount = 0;
    let currentInterval = 5000; // Start at 5s

    const poll = async () => {
      const res = await fetch(`/api/transcripts/${uploadedId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "ready") {
          router.push(`/transcripts/${uploadedId}`);
          return true; // Stop polling
        } else if (data.status === "error") {
          setError("Transcription failed");
          setUploadedId(null);
          return true; // Stop polling
        }
      }
      return false; // Continue polling
    };

    const scheduleNextPoll = () => {
      poll().then((shouldStop) => {
        if (shouldStop) return;

        pollCount++;
        // Exponential backoff: 5s → 10s after 30s → 15s after 60s
        if (pollCount > 12) { // After 60s
          currentInterval = 15000;
        } else if (pollCount > 6) { // After 30s
          currentInterval = 10000;
        }

        setTimeout(scheduleNextPoll, currentInterval);
      });
    };

    // Start first poll after initial interval
    const timeoutId = setTimeout(scheduleNextPoll, currentInterval);

    return () => clearTimeout(timeoutId);
  }, [uploadedId, router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcripts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const result = await res.json();

      // Start polling for completion and refresh page
      setUploadedId(result.id);
      router.refresh(); // Refresh server component data
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  return (
    <div>
      {/* Upload Button */}
      <label
        className={`cursor-pointer rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e55a2b] ${
          uploading || uploadedId ? "cursor-not-allowed opacity-50" : ""
        }`}
      >
        {uploadedId
          ? "Processing..."
          : uploading
            ? "Uploading..."
            : "Upload Audio"}
        <input
          type="file"
          accept=".wav,.mp3,.m4a"
          onChange={handleFileUpload}
          disabled={uploading || !!uploadedId}
          className="hidden"
        />
      </label>

      {/* Error Message */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
