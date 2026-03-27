"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp, Loader2, Sparkles, User } from "lucide-react";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";

type Message = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title: string;
  status: "queued" | "completed" | "waiting_approval" | "running" | "paused_quota" | "failed" | "cancelled" | "draft" | "preview_ready" | "planning" | "waiting_runner";
  updatedAt: string;
  summary: string;
  stepLabel: string;
  finalResponse: string;
  preview: { estimatedCredits: number };
  plan: string[];
  artifacts: Array<{ name: string; kind: string; detail: string }>;
  events: Array<{ label: string; body: string; type: string; at: string }>;
  messages: Message[];
};

const tabLabels = ["Timeline", "Artifacts", "Plan", "Costs", "Logs"];

export function RunConversation({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadConversation() {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, { cache: "no-store" });
      const payload = (await response.json()) as { conversation?: Conversation; error?: string };
      if (!response.ok || !payload.conversation) {
        throw new Error(payload.error || "Unable to load conversation.");
      }
      setConversation(payload.conversation);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConversation();
    const id = window.setInterval(() => {
      void loadConversation();
    }, 4000);

    return () => window.clearInterval(id);
  }, [conversationId]);

  async function handleSend() {
    const content = value.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content }),
      });
      const payload = (await response.json()) as { conversation?: Conversation; error?: string };

      if (!response.ok || !payload.conversation) {
        throw new Error(payload.error || "Unable to send message.");
      }

      setConversation(payload.conversation);
      setValue("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  const transcript = useMemo(() => conversation?.messages || [], [conversation]);

  if (loading) {
    return (
      <Panel eyebrow="Loading" title="Opening conversation">
        <div className="flex items-center gap-3 text-[var(--forge-ink-soft)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Forge conversation...</span>
        </div>
      </Panel>
    );
  }

  if (!conversation) {
    return (
      <Panel eyebrow="Missing run" title="Conversation unavailable">
        <p className="text-sm leading-7 text-[var(--forge-ink-soft)]">
          This conversation could not be found. Create a new task from the workspace and it will appear here.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel eyebrow="Conversation" title={conversation.title}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={conversation.status} />
          <div className="rounded-full border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-2 text-sm text-[var(--forge-ink-soft)]">
            {conversation.stepLabel}
          </div>
          <div className="rounded-full border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-2 text-sm text-[var(--forge-ink-soft)]">
            {conversation.preview.estimatedCredits} credits forecast
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {tabLabels.map((tab, index) => (
            <button
              key={tab}
              className={
                index === 0
                  ? "rounded-full bg-[var(--forge-accent)] px-4 py-2 text-sm font-medium text-white"
                  : "rounded-full border border-[var(--forge-border)] bg-white px-4 py-2 text-sm text-[var(--forge-ink-soft)]"
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {transcript.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role !== "user" ? (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--forge-chip)] text-[var(--forge-ink)]">
                  <Sparkles className="h-4 w-4" />
                </div>
              ) : null}
              <div
                className={`max-w-[82%] rounded-[1.3rem] px-4 py-3 text-sm leading-7 ${
                  message.role === "user"
                    ? "bg-[var(--forge-accent)] text-white"
                    : "border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] text-[var(--forge-ink-soft)]"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" ? (
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c8e8ea] text-[var(--forge-ink)]">
                  <User className="h-4 w-4" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[var(--forge-border)] bg-white p-4">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Send a follow-up message"
            className="min-h-[5rem] w-full resize-none bg-transparent text-sm leading-7 text-[var(--forge-ink)] outline-none placeholder:text-[var(--forge-muted)]"
          />
          <div className="mt-3 flex items-center justify-between">
            {error ? <p className="text-sm text-[#925555]">{error}</p> : <div />}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forge-chip)] text-[var(--forge-muted)] transition hover:bg-[var(--forge-accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-65"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6">
        <Panel eyebrow="Forge response" title="Latest answer">
          <div className="rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-sm leading-7 text-[var(--forge-ink-soft)]">
            {conversation.finalResponse}
          </div>
        </Panel>

        <Panel eyebrow="Planner rationale" title="Execution plan">
          <div className="space-y-3">
            {conversation.plan.map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-sm leading-6 text-[var(--forge-ink-soft)]"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Artifacts" title="Run output">
          <div className="space-y-3">
            {conversation.artifacts.map((artifact) => (
              <div
                key={artifact.name}
                className="rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--forge-muted)]">{artifact.kind}</div>
                <div className="mt-2 text-[var(--forge-ink)]">{artifact.name}</div>
                <div className="mt-2 text-sm text-[var(--forge-ink-soft)]">{artifact.detail}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Timeline" title="Execution events">
          <div className="space-y-3">
            {conversation.events.map((event) => (
              <div
                key={`${event.label}-${event.at}`}
                className="rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm uppercase tracking-[0.22em] text-[var(--forge-muted)]">{event.type.replaceAll("_", " ")}</div>
                  <div className="text-xs text-[var(--forge-muted)]">{event.at}</div>
                </div>
                <div className="mt-2 text-base text-[var(--forge-ink)]">{event.label}</div>
                <p className="mt-2 text-sm leading-7 text-[var(--forge-ink-soft)]">{event.body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
