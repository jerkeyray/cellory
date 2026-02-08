"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Signal {
  id: string;
  signalType: string;
  confidence: number;
  startTime: number;
  endTime: number;
  signalData: {
    description: string;
  };
}

interface Aggregate {
  features: any;
}

interface Call {
  id: string;
  outcome: "success" | "failure";
  status: string;
  createdAt: string;
  transcript: {
    id: string;
    filename: string;
    content: string;
    durationSeconds: number | null;
  };
  signals: Signal[];
  aggregates: Aggregate[];
}

export default function CallDetailPage() {
  const params = useParams();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchCall();

    // Poll while processing
    const interval = setInterval(() => {
      if (call && (call.status === "pending" || call.status === "extracting" || call.status === "aggregating")) {
        fetchCall();
      }
    }, 3000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [params.id]);

  const fetchCall = async () => {
    try {
      const res = await fetch(`/api/calls/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch call");
      const data = await res.json();
      setCall(data);

      // Stop polling if complete or error
      if (data.status === "complete" || data.status === "error") {
        if (refreshInterval) clearInterval(refreshInterval);
      }
    } catch (err) {
      setError("Failed to load call");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      extracting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      aggregating: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || ""}`}>
        {status}
      </span>
    );
  };

  const getMarkerColor = (type: string) => {
    const colors: Record<string, string> = {
      commitment_event: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      blocker_event: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      resolution_attempt: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      control_event: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      stall_event: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "Call not found"}</p>
          <Link href="/calls" className="mt-4 inline-block text-sm text-[#ff6b35] hover:underline">
            Back to Calls
          </Link>
        </div>
      </div>
    );
  }

  const aggregate = call.aggregates[0]?.features;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/calls"
            className="inline-flex items-center text-sm text-[#666] hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Calls
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${call.outcome === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {call.outcome === "success" ? "✓ Success" : "✗ Failure"}
                </span>
                {getStatusBadge(call.status)}
              </div>
              <h1 className="mt-2 text-3xl font-bold text-[#1a1a1a] dark:text-white">
                {call.transcript.filename}
              </h1>
              <p className="mt-1 text-sm text-[#666] dark:text-[#999]">{formatDate(call.createdAt)}</p>
            </div>
          </div>
        </div>

        {call.status !== "complete" && call.status !== "error" && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
            Processing... Status: {call.status}. Page will update automatically.
          </div>
        )}

        {call.status === "error" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            Processing failed. Please try creating a new analysis.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent-Trainable Markers */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Agent Markers ({call.signals.length})
              </h2>

              {call.signals.length === 0 ? (
                <p className="text-sm text-[#666] dark:text-[#999]">
                  {call.status === "complete" ? "No markers detected" : "Processing..."}
                </p>
              ) : (
                <div className="space-y-3">
                  {call.signals.map((marker) => {
                    const data = marker.signalData as any;
                    return (
                      <div
                        key={marker.id}
                        className="flex items-start gap-3 rounded-lg border border-[#e5e5e5] p-3 dark:border-[#2a2a2a]"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getMarkerColor(marker.signalType)}`}>
                              {marker.signalType.replace(/_/g, " ")}
                            </span>
                            {data.subtype && (
                              <span className="text-xs text-[#666] dark:text-[#999]">
                                {data.subtype.replace(/_/g, " ")}
                              </span>
                            )}
                            {data.blockerType && (
                              <span className="text-xs text-[#666] dark:text-[#999]">
                                {data.blockerType.replace(/_/g, " ")}
                                {data.resolved && " ✓ resolved"}
                              </span>
                            )}
                            {data.strategy && (
                              <span className="text-xs text-[#666] dark:text-[#999]">
                                strategy: {data.strategy}
                              </span>
                            )}
                            {data.controller && (
                              <span className="text-xs text-[#666] dark:text-[#999]">
                                {data.controller} control ({data.reason})
                              </span>
                            )}
                            {data.stallType && (
                              <span className="text-xs text-[#666] dark:text-[#999]">
                                {data.stallType.replace(/_/g, " ")}
                              </span>
                            )}
                            <span className="text-xs text-[#999]">
                              {formatTime(marker.startTime)} - {formatTime(marker.endTime)}
                            </span>
                            <span className="text-xs text-[#999]">
                              {Math.round(marker.confidence * 100)}%
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#666] dark:text-[#999]">
                            {data.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h2 className="mb-4 text-lg font-semibold text-[#1a1a1a] dark:text-white">
                Transcript
              </h2>
              <div className="space-y-2">
                {call.transcript.content.split('\n').filter((line: string) => line.trim()).map((line: string, i: number) => {
                  const isAgent = line.trim().startsWith('Agent:');
                  const isCustomer = line.trim().startsWith('Customer:');

                  if (!isAgent && !isCustomer) return null;

                  // Estimate timestamp
                  const estimatedTime = call.transcript.durationSeconds
                    ? Math.floor((i / call.transcript.content.split('\n').length) * call.transcript.durationSeconds)
                    : i * 5;
                  const minutes = Math.floor(estimatedTime / 60);
                  const seconds = estimatedTime % 60;
                  const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                  const text = line.replace(/^(Agent:|Customer:)\s*/, '');

                  return (
                    <div
                      key={i}
                      className="flex gap-3 py-2"
                    >
                      <div className="flex-shrink-0 w-16 text-xs text-[#999] font-mono pt-0.5">
                        {timestamp}
                      </div>
                      <div className="flex-1">
                        <span className="text-xs font-medium text-[#666] dark:text-[#999]">
                          {isAgent ? 'Agent' : 'Customer'}
                        </span>
                        <p className="mt-1 text-sm text-[#1a1a1a] dark:text-white">
                          {text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
              <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] dark:text-white">
                Metadata
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Duration</dt>
                  <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                    {call.transcript.durationSeconds
                      ? formatTime(call.transcript.durationSeconds)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Signals</dt>
                  <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                    {call.signals.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-[#666] dark:text-[#999]">Status</dt>
                  <dd className="mt-1">{getStatusBadge(call.status)}</dd>
                </div>
              </dl>
            </div>

            {/* Aggregates */}
            {aggregate && (
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
                <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] dark:text-white">
                  Aggregates
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-[#666] dark:text-[#999]">Marker Density</dt>
                    <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                      {aggregate.signalDensity?.toFixed(2)} / min
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#666] dark:text-[#999]">Avg Confidence</dt>
                    <dd className="mt-1 font-medium text-[#1a1a1a] dark:text-white">
                      {Math.round((aggregate.avgConfidence || 0) * 100)}%
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#666] dark:text-[#999]">Marker Distribution</dt>
                    <dd className="mt-1 space-y-1 text-xs">
                      {Object.entries(aggregate.signalCounts || {}).map(([type, count]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-[#666] dark:text-[#999]">{type.replace(/_/g, " ")}</span>
                          <span className="font-medium text-[#1a1a1a] dark:text-white">{count as number}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Auxiliary Metrics */}
            {aggregate?.auxiliary_metrics && Object.keys(aggregate.auxiliary_metrics).length > 0 && (
              <div className="rounded-xl border border-[#e5e5e5] bg-white p-6 dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
                <h3 className="mb-4 text-sm font-semibold text-[#1a1a1a] dark:text-white">
                  Call Metrics
                </h3>
                <dl className="space-y-2 text-sm">
                  {aggregate.auxiliary_metrics.call_tone && (
                    <div className="flex justify-between">
                      <dt className="text-[#666] dark:text-[#999]">Tone</dt>
                      <dd className="font-medium text-[#1a1a1a] dark:text-white capitalize">
                        {aggregate.auxiliary_metrics.call_tone}
                      </dd>
                    </div>
                  )}
                  {aggregate.auxiliary_metrics.financial_discussion !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-[#666] dark:text-[#999]">Financial Discussion</dt>
                      <dd className="font-medium text-[#1a1a1a] dark:text-white">
                        {aggregate.auxiliary_metrics.financial_discussion ? "Yes" : "No"}
                      </dd>
                    </div>
                  )}
                  {aggregate.auxiliary_metrics.clear_outcome !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-[#666] dark:text-[#999]">Clear Outcome</dt>
                      <dd className="font-medium text-[#1a1a1a] dark:text-white">
                        {aggregate.auxiliary_metrics.clear_outcome ? "Yes" : "No"}
                      </dd>
                    </div>
                  )}
                  {(aggregate.auxiliary_metrics.agent_turns || aggregate.auxiliary_metrics.customer_turns) && (
                    <div className="flex justify-between">
                      <dt className="text-[#666] dark:text-[#999]">Turn Ratio</dt>
                      <dd className="font-medium text-[#1a1a1a] dark:text-white">
                        Agent: {aggregate.auxiliary_metrics.agent_turns || 0} /
                        Customer: {aggregate.auxiliary_metrics.customer_turns || 0}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
