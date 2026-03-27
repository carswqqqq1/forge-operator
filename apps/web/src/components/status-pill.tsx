import clsx from "clsx";
import type { RunStatus } from "@forge/shared";

type StatusPillProps = {
  status: RunStatus;
};

const statusMap: Record<RunStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-white/10 bg-white/5 text-white/58" },
  preview_ready: { label: "Preview ready", className: "border-white/10 bg-white/5 text-white/58" },
  queued: { label: "Queued", className: "border-white/10 bg-white/5 text-white/58" },
  planning: { label: "Planning", className: "border-sky-400/20 bg-sky-400/12 text-sky-200" },
  waiting_runner: { label: "Waiting runner", className: "border-amber-300/20 bg-amber-300/12 text-amber-100" },
  running: { label: "Running", className: "border-[var(--forge-lime)]/20 bg-[var(--forge-lime)]/12 text-[var(--forge-lime)]" },
  waiting_approval: { label: "Needs approval", className: "border-orange-300/20 bg-orange-300/12 text-orange-100" },
  paused_quota: { label: "Quota paused", className: "border-fuchsia-300/20 bg-fuchsia-300/12 text-fuchsia-100" },
  completed: { label: "Completed", className: "border-emerald-300/20 bg-emerald-300/12 text-emerald-100" },
  failed: { label: "Failed", className: "border-rose-300/20 bg-rose-300/12 text-rose-100" },
  cancelled: { label: "Cancelled", className: "border-white/10 bg-white/5 text-white/45" },
};

export function StatusPill({ status }: StatusPillProps) {
  const config = statusMap[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em]",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
