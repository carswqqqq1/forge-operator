import Link from "next/link";
import { Bell, ChevronRight, CircleHelp, CreditCard, FolderOpen, History, LayoutGrid, Settings2, Sparkles } from "lucide-react";
import { ForgeLogo } from "./forge-logo";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/workspace", label: "New task", icon: Sparkles },
  { href: "/runs/run_02", label: "Runs", icon: History },
  { href: "/usage", label: "Usage", icon: LayoutGrid },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_32%),linear-gradient(180deg,#0b0c0f_0%,#111216_35%,#121318_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 sm:px-6">
        <aside className="hidden w-[270px] shrink-0 rounded-[2rem] border border-white/8 bg-white/4 px-5 py-5 backdrop-blur-xl xl:flex xl:flex-col">
          <div className="mb-8 flex items-center justify-between">
            <ForgeLogo />
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/65">
              <CircleHelp className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-6 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/38">Workspace</div>
            <div className="mb-1 text-base text-white">Forge Pro</div>
            <div className="text-sm text-white/52">Pixel-close operator build with replay, credits, and billing.</div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-3 text-white/72 transition hover:bg-white/8 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                </Link>
              );
            })}
          </nav>

          <div className="mt-8">
            <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/35">Recent runs</div>
            <div className="space-y-2">
              {[
                "Comprehensive research on Manus",
                "Checkout flow UX audit",
                "Replay browser task and extract forms",
              ].map((entry) => (
                <button
                  key={entry}
                  className="flex w-full items-start gap-3 rounded-2xl border border-white/6 bg-white/4 px-3 py-3 text-left transition hover:bg-white/8"
                >
                  <History className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                  <span className="text-sm leading-6 text-white/67">{entry}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-[1.7rem] border border-[#d3ff63]/20 bg-[linear-gradient(180deg,rgba(211,255,99,0.15),rgba(211,255,99,0.06))] p-4 text-black shadow-[0_24px_50px_rgba(198,255,77,0.12)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-black/12 px-2 py-1 text-[0.64rem] uppercase tracking-[0.2em]">Runner</span>
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="font-[family-name:var(--font-serif)] text-2xl tracking-[-0.03em]">Connected</div>
            <p className="mt-2 text-sm leading-6 text-black/76">
              Carson’s local runner is online, quota-aware, and ready for browser automation.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex items-center justify-between rounded-[2rem] border border-white/8 bg-white/4 px-5 py-4 backdrop-blur-xl">
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/36">Forge operator</div>
              <h1 className="font-[family-name:var(--font-serif)] text-[2.2rem] tracking-[-0.05em] text-white">{title}</h1>
              <p className="mt-1 text-sm text-white/55">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/65">
                <Bell className="h-4 w-4" />
              </button>
              <Link href="/pricing" className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10">
                Upgrade
              </Link>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/7 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-sm text-white">CW</div>
                <div className="hidden sm:block">
                  <div className="text-sm text-white">Carson Wesolowski</div>
                  <div className="text-xs text-white/45">Forge Pro</div>
                </div>
              </div>
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
