import { AppShell } from "@/components/app-shell";
import { CheckoutButton } from "@/components/checkout-button";
import { Panel } from "@/components/panel";
import { PortalButton } from "@/components/portal-button";
import { billingCatalog } from "@/lib/config";

export default function BillingPage() {
  return (
    <AppShell title="Billing" subtitle="Monetize Forge with subscriptions, top-ups, and self-serve account management.">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel eyebrow="Plans" title="Hosted Checkout">
          <div className="grid gap-4 lg:grid-cols-3">
            {billingCatalog.map((product, index) => (
              <div key={product.id} className={index === 1 ? "rounded-[1.4rem] border-2 border-[#2583e6] bg-[var(--forge-bg-soft)] p-5" : "rounded-[1.4rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] p-5"}>
                <div className="text-xs uppercase tracking-[0.22em] text-[var(--forge-muted)]">{product.cadence}</div>
                <div className="mt-2 font-[family-name:var(--font-serif)] text-3xl tracking-[-0.05em] text-[var(--forge-ink)]">{product.name}</div>
                <div className="mt-2 text-3xl text-[var(--forge-ink)]">{product.price}</div>
                <p className="mt-3 text-sm leading-7 text-[var(--forge-muted)]">{product.description}</p>
                <div className="mt-4 space-y-2">
                  {product.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-full border border-[var(--forge-border)] bg-white px-3 py-2 text-sm text-[var(--forge-ink-soft)]">
                      {highlight}
                    </div>
                  ))}
                </div>
                <CheckoutButton
                  productId={product.id}
                  label={product.checkoutKind === "subscription" ? "Start subscription" : "Buy credits"}
                  className={index === 1 ? "mt-5 h-12 w-full rounded-2xl bg-[#2583e6] text-sm font-medium text-white transition hover:bg-[#1f73ca]" : "mt-5 h-12 w-full rounded-2xl bg-[var(--forge-accent)] text-sm font-medium text-white transition hover:bg-black"}
                />
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Customer portal" title="Self-serve billing">
            <p className="text-sm leading-7 text-[var(--forge-muted)]">
              Let users update cards, switch plans, view invoices, and cancel without support overhead.
            </p>
            <PortalButton className="mt-5 h-12 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-5 text-sm text-[var(--forge-ink)] transition hover:bg-[var(--forge-chip)]" />
          </Panel>

          <Panel eyebrow="Implementation notes" title="Stripe-ready">
            <div className="space-y-3">
              {[
                "Hosted Checkout handles subscription signup and one-time credit purchases.",
                "Webhook sync finalizes credits, subscriptions, and invoice-linked entitlement updates.",
                "Portal access is exposed in-app so you can stay lean without custom billing UI debt.",
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-sm leading-6 text-[var(--forge-ink-soft)]">
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
