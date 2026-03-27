import { AppShell } from "@/components/app-shell";
import { ChevronRight } from "lucide-react";

export default function UsagePage() {
  return (
    <AppShell title="Usage" subtitle="Credits, renewal timing, and usage history in one place.">
      <div className="mx-auto w-full max-w-[1020px] rounded-[1.8rem] border border-[var(--forge-border)] bg-white p-6">
        <h2 className="text-[2.2rem] font-semibold tracking-[-0.04em] text-[var(--forge-ink)]">Usage</h2>
        <div className="mt-5 rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-[family-name:var(--font-serif)] text-3xl tracking-[-0.04em] text-[var(--forge-ink)]">Forge Pro</div>
              <div className="mt-1 text-sm text-[var(--forge-muted)]">Renewal date Apr 19, 2026</div>
            </div>
            <div className="flex gap-2">
              <button className="rounded-full border border-[var(--forge-border)] bg-white px-4 py-2 text-sm text-[var(--forge-ink)]">Manage</button>
              <button className="rounded-full bg-[var(--forge-accent)] px-4 py-2 text-sm text-white">Add credits</button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 border-t border-[var(--forge-border)] pt-5">
            {[
              { label: "credits", left: "Free credits", leftValue: "851", right: "Monthly credits", rightValue: "0 / 8,000" },
              { label: "Daily refresh credits", left: "Refresh to 300 at 00:00 every day", leftValue: "0", right: "Desktop discount", rightValue: "50% lower" },
            ].map((row) => (
              <div key={row.label} className="grid gap-2 md:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="text-base font-medium text-[var(--forge-ink)]">{row.label}</div>
                  <div className="mt-1 text-sm text-[var(--forge-muted)]">{row.left}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-right text-[var(--forge-ink)]">{row.leftValue}</div>
                  <div className="text-right text-[var(--forge-ink)]">{row.rightValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="mt-4 flex w-full items-center justify-between rounded-[1.15rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-left text-[var(--forge-ink)]">
          <span>Website usage & billing</span>
          <ChevronRight className="h-4 w-4 text-[var(--forge-muted)]" />
        </button>

        <div className="mt-8">
          <div className="mb-4 text-lg font-medium text-[var(--forge-ink)]">Usage record</div>
          <div className="overflow-hidden rounded-[1.2rem] border border-[var(--forge-border)]">
            <div className="grid grid-cols-[1.5fr_0.7fr_0.5fr] gap-4 bg-[var(--forge-bg-soft)] px-4 py-3 text-sm text-[var(--forge-muted)]">
              <div>Details</div>
              <div>Date</div>
              <div className="text-right">Credits change</div>
            </div>
            {[
              ["Comprehensive Research on Manus", "Mar 26, 2026", "-65"],
              ["How do you work", "Mar 26, 2026", "-60"],
              ["How to Build a Low-Cost Cloud Alternative", "Mar 26, 2026", "-173"],
              ["Analyzing Photos and Website for Improvements", "Mar 26, 2026", "-600"],
            ].map(([detail, date, delta]) => (
              <div key={detail} className="grid grid-cols-[1.5fr_0.7fr_0.5fr] gap-4 border-t border-[var(--forge-border)] px-4 py-4 text-sm text-[var(--forge-ink-soft)]">
                <div className="truncate">{detail}</div>
                <div>{date}</div>
                <div className="text-right font-medium text-[var(--forge-ink)]">{delta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
