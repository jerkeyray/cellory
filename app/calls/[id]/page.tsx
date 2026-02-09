"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TagsSection from "./TagsSection";
import NotesSection from "./NotesSection";

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
  const [pollInterval, setPollInterval] = useState(5000); // Start at 5s
  const [pollCount, setPollCount] = useState(0);

  // Initial fetch on mount
  useEffect(() => {
    fetchCall();
  }, [params.id]);

  // Polling effect - runs when call status changes
  useEffect(() => {
    // Only poll if we have a call and it's still processing
    if (!call) return;

    const isProcessing =
      call.status === "pending" ||
      call.status === "extracting" ||
      call.status === "aggregating";

    if (!isProcessing) return;

    // Set up polling with exponential backoff
    const interval = setInterval(() => {
      fetchCall();
      setPollCount(prev => {
        const newCount = prev + 1;

        // Exponential backoff: 5s → 10s after 30s → 15s after 60s
        if (newCount > 12) { // After 60s (12 * 5s)
          setPollInterval(15000);
        } else if (newCount > 6) { // After 30s (6 * 5s)
          setPollInterval(10000);
        }

        return newCount;
      });
    }, pollInterval);

    return () => clearInterval(interval);
  }, [call?.status, pollInterval]);

  const fetchCall = async () => {
    try {
      const res = await fetch(`/api/calls/${params.id}`);
      if (!res.ok) throw new Error("Failed to fetch call");
      const data = await res.json();
      setCall(data);
    } catch (err) {
      setError("Failed to load call");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      pending: "bg-gray-100 text-gray-800",
      extracting: "bg-blue-100 text-blue-800",
      aggregating: "bg-purple-100 text-purple-800",
      complete: "bg-green-100 text-green-800",
      error: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles] || ""}`}>
        {status}
      </span>
    );
  }, []);

  const getMarkerColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      // V2 types
      commitment_event: "bg-green-100 text-green-800",
      blocker_event: "bg-red-100 text-red-800",
      resolution_attempt: "bg-blue-100 text-blue-800",
      control_event: "bg-purple-100 text-purple-800",
      stall_event: "bg-yellow-100 text-yellow-800",
      // V3 types
      customer_constraint: "bg-red-100 text-red-800",
      agent_response_strategy: "bg-blue-100 text-blue-800",
      control_dynamics: "bg-purple-100 text-purple-800",
      commitment_quality: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const aggregate = call?.aggregates[0]?.features;

  // Detect v3 by checking for v3 marker types
  const isV3 = useMemo(() => {
    if (!call) return false;
    const v3Types = [
      "customer_constraint",
      "agent_response_strategy",
      "control_dynamics",
      "commitment_quality",
    ];
    return call.signals.some((s) => v3Types.includes(s.signalType));
  }, [call]);

  // Memoize transcript lines parsing to avoid re-computation
  const transcriptLines = useMemo(() => {
    if (!call) return [];

    return call.transcript.content
      .split("\n")
      .filter((line: string) => line.trim())
      .map((line: string, i: number, arr: string[]) => {
        const isAgent = line.trim().startsWith("Agent:");
        const isCustomer = line.trim().startsWith("Customer:");

        if (!isAgent && !isCustomer) return null;

        // Estimate timestamp
        const estimatedTime = call.transcript.durationSeconds
          ? Math.floor((i / arr.length) * call.transcript.durationSeconds)
          : i * 5;
        const minutes = Math.floor(estimatedTime / 60);
        const seconds = estimatedTime % 60;
        const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        const text = line.replace(/^(Agent:|Customer:)\s*/, "");

        return {
          index: i,
          isAgent,
          isCustomer,
          timestamp,
          text,
        };
      })
      .filter(Boolean);
  }, [call]);

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
          <p className="text-red-600">{error || "Call not found"}</p>
          <Link href="/calls" className="mt-4 inline-block text-sm text-[#ff6b35] hover:underline">
            Back to Calls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/calls"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-[#ff6b35]"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Calls
          </Link>

          <div className="mt-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-semibold ${call.outcome === "success" ? "text-green-600" : "text-red-600"}`}>
                  {call.outcome === "success" ? "Success" : "Failure"}
                </span>
                {getStatusBadge(call.status)}
              </div>
              <h1 className="mt-2 text-3xl font-bold text-foreground">
                {call.transcript.filename}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{formatDate(call.createdAt)}</p>
            </div>
          </div>
        </div>

        {call.status !== "complete" && call.status !== "error" && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Processing... Status: {call.status}. Page will update automatically.
          </div>
        )}

        {call.status === "error" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Processing failed. Please try creating a new analysis.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent-Trainable Markers */}
            <div className="rounded-xl border border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Agent Markers ({call.signals.length})
              </h2>

              {call.signals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {call.status === "complete" ? "No markers detected" : "Processing..."}
                </p>
              ) : (
                <div className="space-y-3">
                  {call.signals.map((marker) => {
                    const data = marker.signalData as any;
                    return (
                      <div
                        key={marker.id}
                        className="flex items-start gap-3 rounded-lg border border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getMarkerColor(marker.signalType)}`}>
                              {marker.signalType.replace(/_/g, " ")}
                            </span>

                            {/* V3 marker rendering */}
                            {isV3 && marker.signalType === "customer_constraint" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {data.constraint_type}
                                </span>
                                <span className={`text-xs ${data.explicit ? "text-orange-600" : "text-muted-foreground"}`}>
                                  {data.explicit ? "explicit" : "implicit"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  severity: {(data.severity * 100).toFixed(0)}%
                                </span>
                              </>
                            )}
                            {isV3 && marker.signalType === "agent_response_strategy" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {data.strategy.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  targets: {data.target_constraint}
                                </span>
                              </>
                            )}
                            {isV3 && marker.signalType === "control_dynamics" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {data.event.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  cause: {data.cause}
                                </span>
                              </>
                            )}
                            {isV3 && marker.signalType === "commitment_quality" && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {data.commitment_type}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  by: {data.initiated_by}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  reversibility: {data.reversibility}
                                </span>
                                {data.time_from_last_constraint >= 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {data.time_from_last_constraint.toFixed(0)}s after constraint
                                  </span>
                                )}
                              </>
                            )}

                            {/* V2 marker rendering */}
                            {!isV3 && data.subtype && (
                              <span className="text-xs text-muted-foreground">
                                {data.subtype.replace(/_/g, " ")}
                              </span>
                            )}
                            {!isV3 && data.blockerType && (
                              <span className="text-xs text-muted-foreground">
                                {data.blockerType.replace(/_/g, " ")}
                                {data.resolved && " ✓ resolved"}
                              </span>
                            )}
                            {!isV3 && data.strategy && (
                              <span className="text-xs text-muted-foreground">
                                strategy: {data.strategy}
                              </span>
                            )}
                            {!isV3 && data.controller && (
                              <span className="text-xs text-muted-foreground">
                                {data.controller} control ({data.reason})
                              </span>
                            )}
                            {!isV3 && data.stallType && (
                              <span className="text-xs text-muted-foreground">
                                {data.stallType.replace(/_/g, " ")}
                              </span>
                            )}

                            {/* Common fields */}
                            <span className="text-xs text-muted-foreground">
                              {isV3 && data.time !== undefined
                                ? formatTime(data.time)
                                : `${formatTime(marker.startTime)} - ${formatTime(marker.endTime)}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(marker.confidence * 100)}%
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
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
            <div className="rounded-xl border border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Transcript
              </h2>
              <div className="space-y-2">
                {transcriptLines.map((line: any) => (
                  <div
                    key={line.index}
                    className="flex gap-3 py-2"
                  >
                    <div className="flex-shrink-0 w-16 text-xs text-muted-foreground font-mono pt-0.5">
                      {line.timestamp}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {line.isAgent ? 'Agent' : 'Customer'}
                      </span>
                      <p className="mt-1 text-sm text-foreground">
                        {line.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata */}
            <div className="rounded-xl border border bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Metadata
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {call.transcript.durationSeconds
                      ? formatTime(call.transcript.durationSeconds)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Signals</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {call.signals.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">{getStatusBadge(call.status)}</dd>
                </div>
              </dl>
            </div>

            {/* Aggregates */}
            {aggregate && (
              <div className="rounded-xl border border bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Aggregates {isV3 && <span className="text-xs text-muted-foreground">(v3)</span>}
                </h3>
                <dl className="space-y-3 text-sm">
                  {isV3 ? (
                    <>
                      {/* V3 Aggregates */}
                      <div>
                        <dt className="text-muted-foreground">Constraints</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {aggregate.constraints_per_call} total
                        </dd>
                        {aggregate.time_to_first_constraint !== null && (
                          <dd className="text-xs text-muted-foreground">
                            First at {aggregate.time_to_first_constraint.toFixed(0)}s
                          </dd>
                        )}
                        <dd className="text-xs text-muted-foreground">
                          Avg severity: {(aggregate.avg_constraint_severity * 100).toFixed(0)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Resolution</dt>
                        {aggregate.avg_resolution_latency !== null && (
                          <dd className="mt-1 font-medium text-foreground">
                            {aggregate.avg_resolution_latency.toFixed(1)}s avg latency
                          </dd>
                        )}
                        <dd className="text-xs text-muted-foreground">
                          {aggregate.unresolved_constraint_count} unresolved
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Control</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {aggregate.control_recoveries} recoveries
                        </dd>
                        <dd className="text-xs text-muted-foreground">
                          {aggregate.control_recovery_before_commitment
                            ? "✓ Recovered before commitment"
                            : "✗ No recovery before commitment"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Commitments</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {aggregate.commitment_count} total
                        </dd>
                        {aggregate.commitment_after_unresolved_constraint && (
                          <dd className="text-xs text-red-600">
                            ⚠️ Commitment after unresolved
                          </dd>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* V2 Aggregates */}
                      <div>
                        <dt className="text-muted-foreground">Marker Density</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {aggregate.signalDensity?.toFixed(2)} / min
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Avg Confidence</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {Math.round((aggregate.avgConfidence || 0) * 100)}%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Marker Distribution</dt>
                        <dd className="mt-1 space-y-1 text-xs">
                          {Object.entries(aggregate.signalCounts || {}).map(([type, count]) => (
                            <div key={type} className="flex justify-between">
                              <span className="text-muted-foreground">{type.replace(/_/g, " ")}</span>
                              <span className="font-medium text-foreground">{count as number}</span>
                            </div>
                          ))}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            )}

            {/* Auxiliary Metrics */}
            {aggregate?.auxiliary_metrics && Object.keys(aggregate.auxiliary_metrics).length > 0 && (
              <div className="rounded-xl border border bg-white p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Call Metrics
                </h3>
                <dl className="space-y-2 text-sm">
                  {aggregate.auxiliary_metrics.call_tone && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Tone</dt>
                      <dd className="font-medium text-foreground capitalize">
                        {aggregate.auxiliary_metrics.call_tone}
                      </dd>
                    </div>
                  )}
                  {aggregate.auxiliary_metrics.financial_discussion !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Financial Discussion</dt>
                      <dd className="font-medium text-foreground">
                        {aggregate.auxiliary_metrics.financial_discussion ? "Yes" : "No"}
                      </dd>
                    </div>
                  )}
                  {aggregate.auxiliary_metrics.clear_outcome !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Clear Outcome</dt>
                      <dd className="font-medium text-foreground">
                        {aggregate.auxiliary_metrics.clear_outcome ? "Yes" : "No"}
                      </dd>
                    </div>
                  )}
                  {(aggregate.auxiliary_metrics.agent_turns || aggregate.auxiliary_metrics.customer_turns) && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Turn Ratio</dt>
                      <dd className="font-medium text-foreground">
                        Agent: {aggregate.auxiliary_metrics.agent_turns || 0} /
                        Customer: {aggregate.auxiliary_metrics.customer_turns || 0}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Tags */}
            <TagsSection callId={call.id} />

            {/* Notes */}
            <NotesSection callId={call.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
