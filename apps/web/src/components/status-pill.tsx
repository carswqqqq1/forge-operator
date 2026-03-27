import clsx from "clsx";
import type { RunStatus } from "@forge/shared";

type StatusPillProps = {
  status: RunStatus;
};

const statusMap: Record<RunStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "border-[var(--forge-border)] bg-[var(--forge-chip)] text-[var(--forge-muted)]" },
  preview_ready: { label: "Preview ready", className: "border-[var(--forge-border)] bg-[var(--forge-chip)] text-[var(--forge-muted)]" },
  queued: { label: "Queued", className: "border-[var(--forge-border)] bg-[var(--forge-chip)] text-[var(--forge-muted)]" },
  planning: { label: "Planning", className: "border-[#dce7f7] bg-[#eff4fb] text-[#57729a]" },
  waiting_runner: { label: "Waiting runner", className: "border-[#e8dcc9] bg-[#faf3ea] text-[#8d6a38]" },
  running: { label: "Running", className: "border-[#dce7f7] bg-[#eef4fb] text-[#5873a0]" },
  waiting_approval: { label: "Needs approval", className: "border-[#eadbcb] bg-[#fbf2e9] text-[#9a6b37]" },
  paused_quota: { label: "Quota paused", className: "border-[#eadff0] bg-[#f7f1fa] text-[#7f5e96]" },
  completed: { label: "Completed", className: "border-[#dcead9] bg-[#eef7ed] text-[#5d8354]" },
  failed: { label: "Failed", className: "border-[#edd9d9] bg-[#fbefef] text-[#925555]" },
  cancelled: { label: "Cancelled", className: "border-[var(--forge-border)] bg-[var(--forge-chip)] text-[var(--forge-muted)]" },
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
