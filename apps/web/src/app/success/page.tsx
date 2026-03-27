import Link from "next/link";
import { ForgeLogo } from "@/components/forge-logo";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_32%),linear-gradient(180deg,#0b0c0f_0%,#111216_35%,#121318_100%)] px-4 text-white">
      <div className="w-full max-w-[560px] rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mb-8 flex justify-center">
          <ForgeLogo compact />
        </div>
        <div className="text-xs uppercase tracking-[0.24em] text-white/34">Payment complete</div>
        <h1 className="mt-3 font-[family-name:var(--font-serif)] text-5xl tracking-[-0.05em]">Forge is funded.</h1>
        <p className="mt-4 text-base leading-8 text-white/58">
          Checkout succeeded. Your subscription or credit pack can now be synced through the Stripe webhook flow.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/workspace" className="rounded-full bg-[var(--forge-lime)] px-5 py-3 text-sm font-medium text-black">
            Open workspace
          </Link>
          <Link href="/billing" className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white/76">
            View billing
          </Link>
        </div>
      </div>
    </main>
  );
}
