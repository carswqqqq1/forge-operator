import Link from "next/link";
import { ArrowRight, CheckCircle2, CirclePlay, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { ForgeLogo } from "@/components/forge-logo";
import { PromptComposer } from "@/components/prompt-composer";

const featureRows = [
  {
    title: "Visible execution",
    body: "Watch each tool call, every screenshot, and the exact step that moved the run forward.",
    icon: CirclePlay,
  },
  {
    title: "Approval-first automation",
    body: "Forge pauses before risky actions so the agent never hides purchases, sends, or destructive work.",
    icon: ShieldCheck,
  },
  {
    title: "Monetized from day one",
    body: "Hosted Checkout, credit packs, and plan-aware UX are wired in from the first launch build.",
    icon: WalletCards,
  },
];

const productMoments = [
  "Centered operator composer with suggestion chips",
  "Run replay, artifacts, costs, and plan inspector",
  "Local runner for zero-dollar founder infrastructure",
  "Stripe billing and portal for paid SaaS growth",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(227,255,131,0.12),transparent_24%),radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,#08090b_0%,#101116_42%,#12141a_100%)] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-12 flex items-center justify-between rounded-[2rem] border border-white/8 bg-white/4 px-5 py-4 backdrop-blur-xl">
          <ForgeLogo />
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78 transition hover:bg-white/10"
            >
              Pricing
            </Link>
            <Link
              href="/auth/sign-in"
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78 transition hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--forge-lime)] px-4 py-2 text-sm font-medium text-black transition hover:bg-[#e4ff92]"
            >
              Open app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="mx-auto w-full max-w-[900px] lg:mx-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-[var(--forge-lime)]" />
              Forge v1
            </div>
            <h1 className="mx-auto max-w-[16ch] text-center font-[family-name:var(--font-serif)] text-6xl leading-none tracking-[-0.07em] text-white sm:text-7xl lg:mx-0 lg:text-left xl:text-[5.9rem]">
              What can I do for you?
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-center text-base leading-8 text-white/58 lg:mx-0 lg:text-left">
              Forge is the premium operator workspace for async AI execution: visible plans, live artifacts, approvals,
              billing, and local-runner power without founder-hosted VM costs.
            </p>

            <div className="mx-auto mt-10 max-w-[920px] lg:mx-0">
              <PromptComposer />
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {productMoments.map((moment) => (
                <div
                  key={moment}
                  className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/18 px-4 py-2 text-sm text-white/65"
                >
                  <CheckCircle2 className="h-4 w-4 text-[var(--forge-lime)]" />
                  {moment}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/35">Live run</div>
                  <div className="mt-1 font-[family-name:var(--font-serif)] text-3xl tracking-[-0.05em] text-white">
                    Checkout Flow Audit
                  </div>
                </div>
                <span className="rounded-full border border-[var(--forge-lime)]/20 bg-[var(--forge-lime)]/12 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[var(--forge-lime)]">
                  Running
                </span>
              </div>
              <div className="space-y-3">
                {[
                  "Plan generated with approval gates for purchases and form submissions",
                  "Local runner opened the target site and attached a screenshot artifact",
                  "Cost preview locked to 9 credits with NVIDIA-first routing",
                ].map((entry) => (
                  <div key={entry} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-white/64">
                    {entry}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {featureRows.map((row) => {
                const Icon = row.icon;

                return (
                  <div key={row.title} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8">
                      <Icon className="h-5 w-5 text-[var(--forge-lime)]" />
                    </div>
                    <div className="font-[family-name:var(--font-serif)] text-2xl tracking-[-0.04em] text-white">{row.title}</div>
                    <p className="mt-2 text-sm leading-7 text-white/57">{row.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
