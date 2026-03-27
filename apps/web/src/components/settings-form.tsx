"use client";

import { useState } from "react";

const fields = [
  "NVIDIA API key",
  "Ollama base URL",
  "GitHub personal access token",
  "Optional custom Stripe config overrides",
];

export function SettingsForm() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid gap-3">
      {fields.map((field) => (
        <label key={field} className="block">
          <div className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--forge-muted)]">{field}</div>
          <input
            className="h-12 w-full rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 text-[var(--forge-ink)] outline-none placeholder:text-[var(--forge-muted)]"
            placeholder={`Configure ${field.toLowerCase()}`}
          />
        </label>
      ))}
      <button
        type="button"
        onClick={handleSave}
        className="mt-2 h-12 rounded-2xl bg-[var(--forge-accent)] px-5 text-sm font-medium text-white transition hover:bg-black"
      >
        Save settings
      </button>
      {saved ? <p className="text-sm text-[#5d8354]">Saved locally for this demo shell.</p> : null}
    </div>
  );
}
