import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gem, Zap, Sparkles } from "lucide-react";

const tierLabels = {
  lite: "Forge 1.6 Lite",
  core: "Forge 1.6",
  max: "Forge 1.6 Max",
} as const;

const tierDescriptions = {
  lite: "Fastest and cheapest tier for lightweight work.",
  core: "Balanced tier for everyday multi-step tasks.",
  max: "Highest reasoning tier for harder jobs and deeper analysis.",
} as const;

function getEventCost(event: any) {
  if (typeof event?.amount === "number") return event.amount;
  if (typeof event?.creditCost === "number") {
    return event.creditCost > 20 ? event.creditCost / 100 : event.creditCost;
  }
  return 0;
}

export default function Billing() {
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });
  const setTier = trpc.usage.setTier.useMutation();

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Billing and usage</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track credits, switch runtime tiers, and inspect recent model spend.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <Gem className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{Math.max(0, Math.round(usageState?.credits ?? 851))} credits</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(["lite", "core", "max"] as const).map((tier) => {
            const active = usageState?.selectedTier === tier;
            return (
              <Card key={tier} className={active ? "border-foreground/20 shadow-[0_8px_30px_rgba(15,23,42,0.06)]" : "border-border/60"}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tierLabels[tier]}</CardTitle>
                    {active ? <Badge variant="secondary">Active</Badge> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">{tierDescriptions[tier]}</p>
                  <Button
                    type="button"
                    variant={active ? "secondary" : "default"}
                    className="w-full"
                    disabled={active || setTier.isPending}
                    onClick={() => setTier.mutate({ tier })}
                  >
                    {active ? "Current tier" : "Switch to this tier"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent credit activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {usageState?.recentEvents?.length ? (
                usageState.recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">{event.note || "Usage event"}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {event.model || "Model"} · {event.tier || "core"} · {event.tokenCount || 0} tokens
                      </div>
                    </div>
                    <div className="text-sm font-medium text-foreground">-{getEventCost(event).toFixed(1)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No credit usage yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How Forge calculates credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
                <Zap className="mt-0.5 h-4 w-4 text-foreground" />
                <p>Every assistant response consumes a small base amount plus a token-scaled amount.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
                <Zap className="mt-0.5 h-4 w-4 text-foreground" />
                <p>Lite burns the fewest credits, core stays balanced, and max spends more for deeper reasoning.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3">
                <Zap className="mt-0.5 h-4 w-4 text-foreground" />
                <p>Your current balance updates automatically after each completed assistant reply.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
