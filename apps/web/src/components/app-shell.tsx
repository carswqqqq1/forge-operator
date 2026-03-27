import Link from "next/link";
import { Bell, ChevronRight, CircleHelp, CreditCard, FolderOpen, History, LayoutGrid, PanelLeft, Search, Settings2, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-[var(--forge-bg)] text-[var(--forge-ink)]">
      <div className="sr-only">
        {title} {subtitle}
      </div>
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-4">
        <aside className="hidden w-[272px] shrink-0 border-r border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-3 py-4 xl:flex xl:flex-col">
          <div className="mb-5 flex items-center justify-between px-2">
            <ForgeLogo />
            <Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--forge-muted)] transition hover:bg-white">
              <PanelLeft className="h-4 w-4" />
            </Link>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[var(--forge-ink-soft)] transition hover:bg-white hover:text-[var(--forge-ink)]"
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

          <div className="mt-7 px-3">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-[var(--forge-muted)]">
              <span>Projects</span>
              <span className="text-lg leading-none">+</span>
            </div>
            <Link href="/settings" className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-[var(--forge-ink-soft)] transition hover:bg-white">
              <FolderOpen className="h-4 w-4" />
              <span>New project</span>
            </Link>
          </div>

          <div className="mt-7 min-h-0 flex-1 px-3">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-[var(--forge-muted)]">
              <span>All tasks</span>
              <Search className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-2">
              {[
                "How to Create a Local Wrapper for Manus",
                "Comprehensive research on Manus",
                "Checkout flow UX audit",
                "How do you work",
                "How to Build a Low-Cost Cloud Alternative",
                "Analyzing Photos and Website for Improvements",
              ].map((entry) => (
                <Link
                  key={entry}
                  href="/runs/run_02"
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-white"
                >
                  <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--forge-muted)]" />
                  <span className="text-sm leading-6 text-[var(--forge-ink-soft)]">{entry}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="rounded-[1.2rem] border border-[var(--forge-border)] bg-white p-4">
              <div className="text-base font-medium text-[var(--forge-ink)]">Share Forge with a friend</div>
              <div className="mt-1 text-sm text-[var(--forge-muted)]">Get 500 credits each</div>
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-[var(--forge-muted)]">
              <div className="flex items-center gap-3">
                <CircleHelp className="h-4 w-4" />
                <Settings2 className="h-4 w-4" />
                <LayoutGrid className="h-4 w-4" />
              </div>
              <div className="text-sm">from forge</div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="text-xl font-medium text-[var(--forge-ink)]">Forge 1.6 Lite</div>
              <ChevronRight className="h-4 w-4 rotate-90 text-[var(--forge-muted)]" />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/usage" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--forge-border)] bg-white text-[var(--forge-muted)]">
                <Bell className="h-4 w-4" />
              </Link>
              <Link href="/usage" className="rounded-full border border-[var(--forge-border)] bg-white px-4 py-2 text-sm text-[var(--forge-ink-soft)] transition hover:bg-[var(--forge-chip)]">
                777
              </Link>
              <div className="flex items-center gap-3 rounded-full bg-white/0 px-0 py-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c8e8ea] text-sm text-[var(--forge-ink)]">CW</div>
              </div>
            </div>
          </header>
          <div className="px-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
