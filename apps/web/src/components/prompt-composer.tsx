"use client";

import { ArrowUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { suggestedPrompts } from "@/lib/mock-data";

type PromptComposerProps = {
  compact?: boolean;
};

export function PromptComposer({ compact = false }: PromptComposerProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placeholder = useMemo(
    () => (compact ? "Assign a task..." : "Assign a task or ask anything"),
    [compact],
  );

  async function handleCreateRun() {
    if (!value.trim()) {
      setError("Add a task for Forge to run.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/runs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });

      const payload = (await response.json()) as { run?: { id: string }; error?: string };

      if (!response.ok || !payload.run) {
        throw new Error(payload.error || "Unable to create run.");
      }

      router.push(`/runs/${payload.run.id}`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to create run.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-[1.8rem] border border-[var(--forge-border)] bg-white px-4 py-4 shadow-[0_12px_26px_rgba(35,32,29,0.05)]">
        <div className="flex min-h-[7.25rem] flex-col justify-between gap-4 sm:min-h-[7.75rem]">
          <textarea
            className="min-h-[4.25rem] w-full resize-none bg-transparent text-[1rem] leading-7 text-[var(--forge-ink)] outline-none placeholder:text-[var(--forge-muted)]"
            placeholder={placeholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setValue(suggestedPrompts[0] || "")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] text-[var(--forge-muted)] transition hover:bg-[var(--forge-chip)]"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCreateRun}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--forge-chip)] text-[var(--forge-muted)] transition hover:bg-[var(--forge-accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-65"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-[#965454]">{error}</p> : null}

      {!compact ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setValue(prompt)}
              className="rounded-full border border-[var(--forge-border)] bg-white px-4 py-2.5 text-sm text-[var(--forge-ink-soft)] transition hover:bg-[var(--forge-chip)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
