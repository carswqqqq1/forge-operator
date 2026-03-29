import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Gem, Zap, Sparkles, RefreshCw, Plus, ChevronRight } from "lucide-react";

const tierLabels = {
  lite: "Forge 1.6 Lite",
  core: "Forge 1.6",
  max: "Forge 1.6 Max",
} as const;

const tierDescriptions = {
  lite: "Fastest and cheapest tier for lightweight work.",
  core: "Balanced tier for everyday multi-step tasks.",
  max: "Highest reasoning tier for deeper analysis.",
} as const;

function getEventCost(event: any) {
  if (typeof event?.amount === "number") return event.amount;
  if (typeof event?.creditCost === "number") return event.creditCost;
  return 0;
}

export default function Billing() {
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });
  const setTier = trpc.usage.setTier.useMutation();
  const credits = Math.max(0, Math.round(usageState?.credits ?? 851));

  return (
    <div className="h-full overflow-y-auto bg-[#f6f5f2]">
      <div className="mx-auto flex max-w-[680px] flex-col gap-6 px-6 py-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Usage</h1>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#1a1816]">Forge Pro</span>
                <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] font-medium text-[#7a746c]">Active</span>
              </div>
              <p className="mt-1 text-[13px] text-[#7a746c]">Renewal date Apr 19, 2026</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-xl border border-[#e8e4dc] bg-white px-4 py-2 text-[13px] font-medium text-[#36322d] transition-colors hover:bg-[#faf9f6]">
                Manage
              </button>
              <button className="rounded-xl bg-[#1a1816] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:opacity-90">
                Add credits
              </button>
            </div>
          </div>
        </div>

        {/* Credits overview */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-[13px] text-[#7a746c]">Credits</div>
              <div className="mt-1 text-[24px] font-semibold text-[#1a1816]">{credits}</div>
            </div>
            <div>
              <div className="text-[13px] text-[#7a746c]">Free credits</div>
              <div className="mt-1 text-[24px] font-semibold text-[#1a1816]">{credits}</div>
            </div>
            <div>
              <div className="text-[13px] text-[#7a746c]">Monthly credits</div>
              <div className="mt-1 text-[24px] font-semibold text-[#1a1816]">0 / 8,000</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#faf9f6] px-4 py-3">
            <RefreshCw className="h-4 w-4 text-[#7a746c]" />
            <div className="text-[13px] text-[#7a746c]">
              Daily refresh credits: <span className="font-medium text-[#36322d]">0</span>
              <span className="ml-2">Refresh to 300 at 00:00 every day</span>
            </div>
          </div>
        </div>

        {/* Tier cards */}
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-[#1a1816]">Runtime tier</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {(["lite", "core", "max"] as const).map((tier) => {
              const active = usageState?.selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => !active && setTier.mutate({ tier })}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-[#1a1816] bg-white shadow-[0_4px_16px_rgba(42,37,30,0.08)]"
                      : "border-[#e8e4dc] bg-white hover:border-[#ddd8cf] hover:shadow-[0_2px_8px_rgba(42,37,30,0.04)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-[#1a1816]">{tierLabels[tier]}</span>
                    {active && (
                      <div className="h-4 w-4 rounded-full bg-[#1a1816] flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] leading-5 text-[#7a746c]">{tierDescriptions[tier]}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage record */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white">
          <div className="flex items-center justify-between border-b border-[#e8e4dc] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[#1a1816]">Usage record</h2>
          </div>
          <div className="divide-y divide-[#e8e4dc]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-2.5 text-[12px] font-medium text-[#7a746c]">
              <span>Details</span>
              <span>Date</span>
              <span className="text-right">Credits change</span>
            </div>
            {usageState?.recentEvents?.length ? (
              usageState.recentEvents.map((event: any) => (
                <div key={event.id} className="grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-3 text-[13px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#7a746c]" />
                    <span className="truncate text-[#36322d]">{event.note || "Usage event"}</span>
                  </div>
                  <span className="text-[#7a746c]">{event.createdAt ? new Date(event.createdAt).toLocaleDateString() : "—"}</span>
                  <span className="text-right font-medium text-[#1a1816]">-{getEventCost(event).toFixed(1)}</span>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-center text-[13px] text-[#7a746c]">
                No credit usage yet.
              </div>
            )}
          </div>
        </div>

        {/* How credits work */}
        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#1a1816]">How Forge calculates credits</h2>
          <div className="mt-3 space-y-2.5">
            {[
              "Every assistant response consumes a small base amount plus a token-scaled amount.",
              "Lite burns the fewest credits, core stays balanced, and max spends more for deeper reasoning.",
              "Your current balance updates automatically after each completed assistant reply.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-[#faf9f6] px-4 py-3">
                <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#7a746c]" />
                <p className="text-[13px] leading-6 text-[#7a746c]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
