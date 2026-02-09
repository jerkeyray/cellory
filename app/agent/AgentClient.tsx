"use client";

import { useState } from "react";
import { Conversation } from "@elevenlabs/client";

type AgentMessage = {
  role: "agent" | "user";
  text: string;
};

type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

type Playbook = {
  id: string;
  title: string;
  content: string;
};

interface AgentClientProps {
  playbooks: Playbook[];
}

export default function AgentClient({ playbooks }: AgentClientProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>("");
  const [contextText, setContextText] = useState<string>("");
  const [contextSentAt, setContextSentAt] = useState<string | null>(null);

  const startSession = async () => {
    setError(null);
    setStatus("connecting");

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const tokenRes = await fetch("/api/agent/token");
      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get conversation token");
      }
      const { token } = await tokenRes.json();

      const conv = await Conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        onConnect: () => setStatus("connected"),
        onDisconnect: () => setStatus("idle"),
        onError: (err) => {
          console.error("[agent] error", err);
          setError("Conversation error");
          setStatus("error");
        },
        onMessage: (msg: any) => {
          const text =
            msg?.text ||
            msg?.message?.text ||
            msg?.content ||
            msg?.message ||
            null;
          const role =
            msg?.role ||
            msg?.message?.role ||
            (msg?.speaker === "agent" ? "agent" : "user");

          if (typeof text === "string" && text.trim().length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: role === "agent" ? "agent" : "user",
                text: text.trim(),
              },
            ]);
          }
        },
      });

      setConversation(conv);
    } catch (e: any) {
      console.error("[agent] start failed", e);
      setError(e?.message || "Failed to start session");
      setStatus("error");
    }
  };

  const endSession = async () => {
    try {
      await conversation?.endSession();
    } catch (e) {
      console.error("[agent] end failed", e);
    } finally {
      setConversation(null);
      setStatus("idle");
    }
  };

  const clearTranscript = () => {
    setMessages([]);
  };

  const loadSelectedPlaybook = (id: string) => {
    setSelectedPlaybookId(id);
    const pb = playbooks.find((p) => p.id === id);
    setContextText(pb?.content || "");
    setContextSentAt(null);
  };

  const sendContext = async () => {
    if (!conversation) {
      setError("Start a session before sending context");
      return;
    }
    if (!contextText.trim()) {
      setError("Add playbook markdown to send");
      return;
    }

    setError(null);
    try {
      await conversation.sendContextualUpdate(
        `Playbook context for the agent. Use this guidance to answer user questions and steer the conversation:\n\n${contextText}`
      );
      setContextSentAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      console.error("[agent] send context failed", e);
      setError(e?.message || "Failed to send context");
    }
  };

  return (
    <div className="rounded-2xl border border bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Voice Agent</h2>
          <p className="text-sm text-muted-foreground">
            Start a private ElevenLabs agent session and generate a demo transcript.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status !== "connected" ? (
            <button
              onClick={startSession}
              className="rounded-lg bg-[#ff6b35] px-4 py-2 text-sm font-medium text-white hover:bg-[#e55a2b]"
            >
              Start Session
            </button>
          ) : (
            <button
              onClick={endSession}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground"
            >
              End Session
            </button>
          )}
          <button
            onClick={clearTranscript}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border bg-white p-4">
          <div className="mb-3 text-sm font-medium text-foreground">Live Transcript</div>
          <div className="h-72 overflow-auto rounded-lg border border bg-background p-3 text-sm">
            {messages.length === 0 ? (
              <div className="text-muted-foreground">No messages yet.</div>
            ) : (
              messages.map((m, i) => (
                <div key={`${m.role}-${i}`} className="mb-2">
                  <span className="font-medium text-foreground">
                    {m.role === "agent" ? "Agent" : "Customer"}:
                  </span>{" "}
                  <span className="text-muted-foreground">{m.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border bg-white p-4">
          <div className="mb-3 text-sm font-medium text-foreground">Playbook Context</div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={selectedPlaybookId}
              onChange={(e) => loadSelectedPlaybook(e.target.value)}
              className="rounded-lg border border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">Select a playbook</option>
              {playbooks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setContextText("")}
              className="rounded-lg border px-3 py-2 text-sm text-foreground"
            >
              Clear
            </button>
          </div>
          <textarea
            value={contextText}
            onChange={(e) => setContextText(e.target.value)}
            className="h-72 w-full resize-none rounded-lg border border bg-background p-3 text-sm text-muted-foreground"
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {contextSentAt ? `Context sent at ${contextSentAt}` : "Context not sent"}
            </div>
            <button
              onClick={sendContext}
              disabled={!contextText.trim() || status !== "connected"}
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Context
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
