import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { PromptComposer } from "@/components/prompt-composer";
import { StatusPill } from "@/components/status-pill";
import { artifacts, previewExample, recentRuns } from "@/lib/mock-data";

export default function WorkspacePage() {
  return (
    <AppShell title="What can I do for you?" subtitle="Launch async work, inspect live runs, and keep every artifact in one premium workspace.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="New task" title="Operator composer">
          <PromptComposer compact />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: "Cost preview", value: `${previewExample.estimatedCredits} credits` },
              { label: "Default provider", value: "NVIDIA free" },
              { label: "Fallback", value: "Local Ollama" },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/34">{item.label}</div>
                <div className="mt-2 text-lg text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Needs attention" title="Approval queue">
          <div className="space-y-3">
            {[
              "Submit payment form on billing demo site",
              "Allow Forge to push a summary branch to GitHub",
              "Approve sending the launch brief by email",
            ].map((task) => (
              <div key={task} className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4">
                <div className="max-w-[26ch] text-sm leading-6 text-white/68">{task}</div>
                <button className="rounded-full bg-[var(--forge-lime)] px-4 py-2 text-sm font-medium text-black">Review</button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Recent runs" title="Execution inbox" className="forge-scrollbar max-h-[34rem] overflow-auto">
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div key={run.id} className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="font-[family-name:var(--font-serif)] text-2xl tracking-[-0.04em] text-white">{run.title}</div>
                  <StatusPill status={run.status} />
                </div>
                <div className="text-sm text-white/48">Updated {run.updatedAt}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Artifact workspace" title="Latest deliverables">
            <div className="grid gap-3 md:grid-cols-3">
              {artifacts.map((artifact) => (
                <div key={artifact.name} className="rounded-[1.5rem] border border-white/8 bg-black/20 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/34">{artifact.kind}</div>
                  <div className="mt-2 text-sm leading-6 text-white">{artifact.name}</div>
                  <div className="mt-2 text-sm text-white/46">{artifact.detail}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Project memory" title="Sticky context">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Tone: concise, founder-facing, launch-ready",
                "Runner policy: approval required for purchases and sends",
                "Primary objective: beat Manus on reliability and visibility",
                "Billing model: Pro subscription plus one-time credit packs",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-6 text-white/64">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
