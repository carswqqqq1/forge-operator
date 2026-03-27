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
            {billingCatalog.map((product) => (
              <div key={product.id} className="rounded-[1.7rem] border border-white/10 bg-black/18 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/34">{product.cadence}</div>
                <div className="mt-2 font-[family-name:var(--font-serif)] text-3xl tracking-[-0.05em] text-white">{product.name}</div>
                <div className="mt-2 text-3xl text-white">{product.price}</div>
                <p className="mt-3 text-sm leading-7 text-white/56">{product.description}</p>
                <div className="mt-4 space-y-2">
                  {product.highlights.map((highlight) => (
                    <div key={highlight} className="rounded-full border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/63">
                      {highlight}
                    </div>
                  ))}
                </div>
                <CheckoutButton
                  productId={product.id}
                  label={product.checkoutKind === "subscription" ? "Start subscription" : "Buy credits"}
                  className="mt-5 h-12 w-full rounded-2xl bg-[var(--forge-lime)] text-sm font-medium text-black transition hover:bg-[#e5ff95]"
                />
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="Customer portal" title="Self-serve billing">
            <p className="text-sm leading-7 text-white/57">
              Let users update cards, switch plans, view invoices, and cancel without support overhead.
            </p>
            <PortalButton className="mt-5 h-12 rounded-2xl border border-white/10 bg-white/6 px-5 text-sm text-white transition hover:bg-white/10" />
          </Panel>

          <Panel eyebrow="Implementation notes" title="Stripe-ready">
            <div className="space-y-3">
              {[
                "Hosted Checkout handles subscription signup and one-time credit purchases.",
                "Webhook sync finalizes credits, subscriptions, and invoice-linked entitlement updates.",
                "Portal access is exposed in-app so you can stay lean without custom billing UI debt.",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
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
