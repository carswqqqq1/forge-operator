import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CheckoutButton } from "@/components/checkout-button";
import { ForgeLogo } from "@/components/forge-logo";
import { billingCatalog } from "@/lib/config";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_32%),linear-gradient(180deg,#0b0c0f_0%,#111216_35%,#121318_100%)] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-10 flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <ForgeLogo />
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </header>

        <div className="mx-auto max-w-[760px] text-center">
          <div className="text-xs uppercase tracking-[0.26em] text-white/34">Pricing</div>
          <h1 className="mt-3 font-[family-name:var(--font-serif)] text-6xl tracking-[-0.06em] text-white">Monetize Forge cleanly.</h1>
          <p className="mt-4 text-base leading-8 text-white/57">
            Start with a Pro subscription, layer in one-time credit packs, and keep billing self-serve through Stripe Checkout and the customer portal.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {billingCatalog.map((product) => (
            <section key={product.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-[0.22em] text-white/34">{product.cadence}</div>
              <div className="mt-2 font-[family-name:var(--font-serif)] text-4xl tracking-[-0.05em] text-white">{product.name}</div>
              <div className="mt-2 text-4xl text-white">{product.price}</div>
              <p className="mt-4 text-sm leading-7 text-white/56">{product.description}</p>
              <div className="mt-5 space-y-2">
                {product.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-full border border-white/8 bg-black/18 px-3 py-2 text-sm text-white/64">
                    {highlight}
                  </div>
                ))}
              </div>
              <CheckoutButton
                productId={product.id}
                label={product.checkoutKind === "subscription" ? "Choose Pro" : "Buy credits"}
                className="mt-6 h-12 w-full rounded-2xl bg-[var(--forge-lime)] text-sm font-medium text-black transition hover:bg-[#e4ff90]"
              />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
