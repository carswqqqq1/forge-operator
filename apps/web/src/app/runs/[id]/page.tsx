import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { StatusPill } from "@/components/status-pill";
import { artifacts, timelineEvents } from "@/lib/mock-data";

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
};

const tabLabels = ["Timeline", "Artifacts", "Plan", "Costs", "Logs"];

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;

  return (
    <AppShell title="Checkout Flow Audit" subtitle={`Run ${id} is streaming tool activity, artifacts, and approvals in real time.`}>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="Run status" title="Replayable execution">
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill status="running" />
            <div className="rounded-full border border-white/8 bg-black/18 px-4 py-2 text-sm text-white/55">Step 3 of 5</div>
            <div className="rounded-full border border-white/8 bg-black/18 px-4 py-2 text-sm text-white/55">9 credits forecast</div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {tabLabels.map((tab, index) => (
              <button
                key={tab}
                className={
                  index === 0
                    ? "rounded-full bg-[var(--forge-lime)] px-4 py-2 text-sm font-medium text-black"
                    : "rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/68"
                }
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {timelineEvents.map((event) => (
              <div key={`${event.label}-${event.at}`} className="rounded-[1.4rem] border border-white/8 bg-black/18 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm uppercase tracking-[0.22em] text-white/34">{event.type.replaceAll("_", " ")}</div>
                  <div className="text-xs text-white/34">{event.at}</div>
                </div>
                <div className="mt-2 text-lg text-white">{event.label}</div>
                <p className="mt-2 text-sm leading-7 text-white/56">{event.body}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Why this step" title="Planner rationale">
            <div className="space-y-3">
              {[
                "Capture the current page state before interacting with a live form.",
                "Persist screenshots and extracted fields into the artifact workspace for replay.",
                "Pause at the submission boundary because user approval is required for an external side effect.",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Artifacts" title="Run output">
            <div className="space-y-3">
              {artifacts.map((artifact) => (
                <div key={artifact.name} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-white/34">{artifact.kind}</div>
                  <div className="mt-2 text-white">{artifact.name}</div>
                  <div className="mt-2 text-sm text-white/48">{artifact.detail}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
