import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";

export default function UsagePage() {
  return (
    <AppShell title="Usage" subtitle="Keep credits, plan limits, and provider fallback health visible at a glance.">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Current plan", value: "Forge Pro", detail: "Monthly subscription active" },
          { label: "Credits remaining", value: "851", detail: "Renews in 14 days" },
          { label: "Quota state", value: "Healthy", detail: "NVIDIA-first, Ollama fallback available" },
        ].map((card) => (
          <Panel key={card.label} eyebrow={card.label} title={card.value}>
            <p className="text-sm leading-7 text-white/55">{card.detail}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Usage ledger" title="Recent activity">
          <div className="space-y-3">
            {[
              "Checkout Flow Audit used 9 credits",
              "Replay browser task used 4 credits",
              "Forge Pro monthly grant added 1,200 credits",
            ].map((row) => (
              <div key={row} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
                {row}
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Quota-aware UX" title="Fallback visibility">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Primary model provider: NVIDIA free endpoints",
              "Fallback execution: local runner with Ollama",
              "Browser operator: connected on Carson’s MacBook Pro",
              "Paused-quota behavior: preserve checkpoint and resume later",
            ].map((item) => (
              <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
