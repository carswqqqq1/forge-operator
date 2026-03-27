import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
import { ForgeLogo } from "@/components/forge-logo";
import { billingCatalog } from "@/lib/config";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--forge-bg)] px-4 py-6 text-[var(--forge-ink)] sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-5 flex items-center justify-between rounded-[1.25rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-5 py-3">
          <ForgeLogo />
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[var(--forge-ink-soft)] transition hover:text-[var(--forge-ink)]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </header>

        <div className="mb-12 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-chip)] px-5 py-3 text-center text-sm text-[var(--forge-ink-soft)]">
          Forge is building the execution layer for AI workspaces and browser operators
        </div>

        <div className="mx-auto max-w-[760px] text-center">
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-6xl tracking-[-0.06em] text-[var(--forge-ink)]">
            Forge Pricing Plans
          </h1>
          <p className="mt-4 text-base leading-8 text-[var(--forge-muted)]">
            Start with a Pro subscription, layer in one-time credit packs, and keep billing self-serve through hosted checkout and the customer portal.
          </p>
        </div>

        <div className="mx-auto mt-8 flex w-fit rounded-xl border border-[var(--forge-border)] bg-white p-1 text-sm">
          <button className="rounded-lg bg-[var(--forge-chip)] px-4 py-2 font-medium text-[var(--forge-ink)]">Monthly</button>
          <button className="rounded-lg px-4 py-2 text-[var(--forge-muted)]">Annually · Save 17%</button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {billingCatalog.map((product, index) => (
            <section
              key={product.id}
              className={
                index === 1
                  ? "rounded-[1.6rem] border-2 border-[#2583e6] bg-white p-6"
                  : "rounded-[1.6rem] border border-[var(--forge-border)] bg-white p-6"
              }
            >
              <div className="mt-1 flex items-end gap-2 text-[var(--forge-ink)]">
                <span className="text-5xl font-semibold tracking-[-0.05em]">{product.price.replace(/[^0-9$]/g, "")}</span>
                <span className="pb-1 text-xl text-[var(--forge-muted)]">/ month</span>
              </div>
              <div className="mt-6 text-lg text-[var(--forge-ink-soft)]">{product.description}</div>
              <div className="mt-5 space-y-2">
                {product.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2 text-sm text-[var(--forge-ink-soft)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--forge-muted)]" />
                    {highlight}
                  </div>
                ))}
              </div>
              <CheckoutButton
                productId={product.id}
                label={product.checkoutKind === "subscription" ? "Choose Pro" : "Buy credits"}
                className={
                  index === 1
                    ? "mt-6 h-12 w-full rounded-2xl bg-[#2583e6] text-sm font-medium text-white transition hover:bg-[#1f73ca]"
                    : "mt-6 h-12 w-full rounded-2xl bg-[var(--forge-accent)] text-sm font-medium text-white transition hover:bg-black"
                }
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
