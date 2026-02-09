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
          <h2 className="text-lg font-semibold text-foreground">Agent Context</h2>
          <p className="text-sm text-muted-foreground">
            Paste your playbook markdown, send it as context, then talk to the agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearTranscript}
            className="rounded-lg border px-3 py-2 text-sm font-medium text-foreground"
          >
            Clear Chat
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border border bg-white p-4 lg:col-span-3">
          <div className="mb-3 text-sm font-medium text-foreground">Playbook Markdown</div>
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
            className="h-80 w-full resize-none rounded-lg border border bg-background p-3 text-sm text-muted-foreground"
            placeholder="Paste playbook markdown here..."
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

        <div className="rounded-xl border border bg-white p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-foreground">Voice Session</div>
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <span
                className={`absolute h-40 w-40 rounded-full ${
                  status === "connected" ? "bg-[#ff6b35]/10" : "bg-[#1a1a1a]/5"
                }`}
              />
              <span
                className={`absolute h-32 w-32 rounded-full ${
                  status === "connected"
                    ? "animate-ping bg-[#ff6b35]/20"
                    : "bg-transparent"
                }`}
              />
              <span
                className={`absolute h-24 w-24 rounded-full ${
                  status === "connected"
                    ? "animate-ping bg-[#ff6b35]/30 [animation-delay:300ms]"
                    : "bg-transparent"
                }`}
              />
              <button
                onClick={status !== "connected" ? startSession : endSession}
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full text-sm font-semibold ${
                  status === "connected"
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-[#ff6b35] text-white hover:bg-[#e55a2b]"
                }`}
              >
                {status === "connected" ? "Stop" : "Talk"}
              </button>
            </div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {status === "connected"
                ? "Connected"
                : status === "connecting"
                ? "Connecting"
                : "Idle"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border bg-white p-4">
        <div className="mb-3 text-sm font-medium text-foreground">Conversation</div>
        <div className="h-64 overflow-auto rounded-lg border border bg-background p-3 text-sm">
          {messages.length === 0 ? (
            <div className="text-muted-foreground">No messages yet.</div>
          ) : (
            messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`mb-3 flex ${m.role === "agent" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "agent"
                      ? "bg-white text-foreground shadow-sm"
                      : "bg-[#1a1a1a] text-white"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {m.role === "agent" ? "Agent" : "Customer"}
                  </div>
                  <div>{m.text}</div>
                </div>
              </div>
            ))
          )}
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
