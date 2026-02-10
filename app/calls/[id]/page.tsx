"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TagsSection from "./TagsSection";
import NotesSection from "./NotesSection";
import AudioQualityBadge from "@/app/components/AudioQualityBadge";
import DiarizationTimeline from "@/app/components/DiarizationTimeline";
import NLUInsightsCard from "@/app/components/NLUInsightsCard";
import { DiarizationSegment, NLUResults, WhisperSegment } from "@/app/lib/types/audio-intelligence";

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
    source: string;
    skipTranscription: boolean;
    content: string;
    durationSeconds: number | null;
    qualityScore: number | null;
    audioFormat: string | null;
    audioSampleRate: number | null;
    audioChannels: number | null;
    audioBitrate: number | null;
    speechRatio: number | null;
    avgConfidence: number | null;
    diarizationSegments: any | null;
    speakerCount: number | null;
    nluResults: any | null;
    whisperSegments: any | null;
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

    // Max timeout: 5 minutes (60 polls at 5s average)
    const MAX_POLL_COUNT = 60;

    if (pollCount >= MAX_POLL_COUNT) {
      setError(`Processing timeout - call stuck in "${call.status}" state for over 5 minutes. Please refresh the page or contact support.`);
      return;
    }

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

        // Check for timeout
        if (newCount >= MAX_POLL_COUNT) {
          setError(`Processing timeout - call stuck in "${call.status}" state for over 5 minutes. Please refresh the page or contact support.`);
          clearInterval(interval);
        }

        return newCount;
      });
    }, pollInterval);

    return () => clearInterval(interval);
  }, [call?.status, pollInterval, pollCount]);

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#ff6b35] border-t-transparent" />
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
    <div className="min-h-screen bg-background">
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
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-lg font-semibold ${call.outcome === "success" ? "text-green-600" : "text-red-600"}`}>
                  {call.outcome === "success" ? "Success" : "Failure"}
                </span>
                {getStatusBadge(call.status)}
                {call.transcript.qualityScore !== null && call.transcript.qualityScore !== undefined && (
                  <AudioQualityBadge
                    qualityScore={call.transcript.qualityScore}
                    flags={
                      call.transcript.whisperSegments
                        ? ([] as any[]) // Flags would be computed from segments if needed
                        : []
                    }
                  />
                )}
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
                <div className="space-y-2.5">
                  {call.signals.map((marker) => {
                    const data = marker.signalData as any;
                    return (
                      <div
                        key={marker.id}
                        className="rounded-lg border border bg-gray-50/50 p-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${getMarkerColor(marker.signalType)}`}>
                              {marker.signalType.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {isV3 && data.time !== undefined
                                ? formatTime(data.time)
                                : `${formatTime(marker.startTime)}`}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {Math.round(marker.confidence * 100)}%
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-foreground mb-2">
                          {data.description}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          {/* V3 marker metadata */}
                          {isV3 && marker.signalType === "customer_constraint" && (
                            <>
                              <span className="font-medium">{data.constraint_type}</span>
                              <span className={data.explicit ? "text-orange-600 font-medium" : ""}>
                                {data.explicit ? "explicit" : "implicit"}
                              </span>
                              <span>severity: {(data.severity * 100).toFixed(0)}%</span>
                            </>
                          )}
                          {isV3 && marker.signalType === "agent_response_strategy" && (
                            <>
                              <span className="font-medium">{data.strategy.replace(/_/g, " ")}</span>
                              <span>→ {data.target_constraint}</span>
                            </>
                          )}
                          {isV3 && marker.signalType === "control_dynamics" && (
                            <>
                              <span className="font-medium">{data.event.replace(/_/g, " ")}</span>
                              <span>• {data.cause}</span>
                            </>
                          )}
                          {isV3 && marker.signalType === "commitment_quality" && (
                            <>
                              <span className="font-medium">{data.commitment_type}</span>
                              <span>by {data.initiated_by}</span>
                              <span>reversibility: {data.reversibility}</span>
                              {data.time_from_last_constraint >= 0 && (
                                <span>{data.time_from_last_constraint.toFixed(0)}s after constraint</span>
                              )}
                            </>
                          )}

                          {/* NLU marker metadata */}
                          {marker.signalType === "intent_classification" && (
                            <>
                              <span className="font-medium">{data.intent?.replace(/_/g, " ")}</span>
                              <span>{data.speaker}</span>
                            </>
                          )}
                          {marker.signalType === "obligation_detection" && (
                            <>
                              <span className="font-medium">{data.obligation_type?.replace(/_/g, " ")}</span>
                              <span>by {data.obligor}</span>
                              {data.deadline && <span className="text-orange-600 font-medium">due: {data.deadline}</span>}
                            </>
                          )}
                          {marker.signalType === "regulatory_phrase" && (
                            <>
                              <span className="font-medium">{data.regulation_type?.replace(/_/g, " ")}</span>
                              <span className={data.present ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {data.present ? "✓ present" : "✗ missing"}
                              </span>
                            </>
                          )}
                          {marker.signalType === "entity_mention" && (
                            <>
                              <span className="font-medium">{data.entity_type?.replace(/_/g, " ")}</span>
                              <span className="font-mono text-foreground">{data.value}</span>
                            </>
                          )}

                          {/* V2 marker metadata */}
                          {!isV3 && data.subtype && (
                            <span className="font-medium">{data.subtype.replace(/_/g, " ")}</span>
                          )}
                          {!isV3 && data.blockerType && (
                            <>
                              <span className="font-medium">{data.blockerType.replace(/_/g, " ")}</span>
                              {data.resolved && <span className="text-green-600 font-medium">✓ resolved</span>}
                            </>
                          )}
                          {!isV3 && data.strategy && (
                            <span>{data.strategy}</span>
                          )}
                          {!isV3 && data.controller && (
                            <span>{data.controller} control ({data.reason})</span>
                          )}
                          {!isV3 && data.stallType && (
                            <span className="font-medium">{data.stallType.replace(/_/g, " ")}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transcript */}
            <div className="rounded-xl border border bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Transcript
                </h2>
                <button
                  type="button"
                  onClick={() => window.open(`/api/transcripts/${call.transcript.id}?format=csv`, "_blank")}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Download CSV
                </button>
              </div>

              {/* Diarization Timeline */}
              {call.transcript.diarizationSegments && call.transcript.durationSeconds && (
                <div className="mb-6">
                  <DiarizationTimeline
                    segments={call.transcript.diarizationSegments as DiarizationSegment[]}
                    totalDuration={call.transcript.durationSeconds}
                  />
                </div>
              )}

              <div className="space-y-2">
                {transcriptLines.map((line: any) => (
                  <div
                    key={line.index}
                    className="flex gap-4 py-2"
                  >
                    <div className="flex-shrink-0 w-14 text-xs text-muted-foreground font-mono">
                      {line.timestamp}
                    </div>
                    <div className="flex-shrink-0 w-20">
                      <span className={`text-xs font-medium ${line.isAgent ? 'text-blue-600' : 'text-orange-600'}`}>
                        {line.isAgent ? 'Agent' : 'Customer'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
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
                  <dt className="text-muted-foreground">Transcript Source</dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {call.transcript.skipTranscription ? `Imported (${call.transcript.source})` : "Audio upload"}
                  </dd>
                </div>
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
                {call.transcript.audioFormat && (
                  <div>
                    <dt className="text-muted-foreground">Audio Format</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {call.transcript.audioFormat}
                    </dd>
                  </div>
                )}
                {call.transcript.audioSampleRate && (
                  <div>
                    <dt className="text-muted-foreground">Sample Rate</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {(call.transcript.audioSampleRate / 1000).toFixed(1)} kHz
                    </dd>
                  </div>
                )}
                {call.transcript.audioChannels && (
                  <div>
                    <dt className="text-muted-foreground">Channels</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {call.transcript.audioChannels === 1 ? "Mono" : call.transcript.audioChannels === 2 ? "Stereo" : call.transcript.audioChannels}
                    </dd>
                  </div>
                )}
                {call.transcript.speechRatio !== null && call.transcript.speechRatio !== undefined && (
                  <div>
                    <dt className="text-muted-foreground">Speech Ratio</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {Math.round(call.transcript.speechRatio * 100)}%
                    </dd>
                  </div>
                )}
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

            {/* NLU Insights */}
            {call.transcript.nluResults && (
              <NLUInsightsCard nluResults={call.transcript.nluResults as NLUResults} />
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
