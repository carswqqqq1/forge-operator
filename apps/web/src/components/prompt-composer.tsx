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
      <div className="rounded-[2rem] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex min-h-[7.25rem] flex-col justify-between gap-4 sm:min-h-[7.75rem]">
          <textarea
            className="min-h-[4.25rem] w-full resize-none bg-transparent text-[1rem] leading-7 text-white/85 outline-none placeholder:text-white/28"
            placeholder={placeholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="flex items-center justify-between">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/7 text-white/70 transition hover:border-white/20 hover:bg-white/12">
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCreateRun}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-[#d3ff63] hover:text-black disabled:cursor-not-allowed disabled:opacity-65"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-200/88">{error}</p> : null}

      {!compact ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setValue(prompt)}
              className="rounded-full border border-white/10 bg-white/4 px-4 py-2.5 text-sm text-white/78 transition hover:border-white/20 hover:bg-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
