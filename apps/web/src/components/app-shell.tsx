"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FolderOpen,
  History,
  LayoutGrid,
  Library,
  PanelLeft,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ForgeLogo } from "./forge-logo";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/workspace", label: "New task", icon: Sparkles, key: "new-task" },
  { href: "/workspace?tab=agents", label: "Agents", icon: Sparkles, key: "agents" },
  { href: "/usage", label: "Search", icon: Search },
  { href: "/settings", label: "Library", icon: Library },
];

type ConversationListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { conversations?: ConversationListItem[] };
        if (!cancelled) {
          setConversations(payload.conversations || []);
        }
      } catch {
        if (!cancelled) {
          setConversations([]);
        }
      }
    }

    void loadConversations();
    const id = window.setInterval(loadConversations, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.key ?? item.href}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition ${
                    isActive
                      ? "bg-white text-[var(--forge-ink)]"
                      : "text-[var(--forge-ink-soft)] hover:bg-white hover:text-[var(--forge-ink)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.label === "Agents" ? (
                    <span className="rounded-full bg-[#e7f2e9] px-2 py-0.5 text-[10px] font-medium text-[#3f7a4f]">New</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                  )}
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
              {conversations.length ? (
                conversations.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/runs/${entry.id}`}
                    className={`flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition ${
                      pathname === `/runs/${entry.id}` ? "bg-white" : "hover:bg-white"
                    }`}
                  >
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-[var(--forge-muted)]" />
                    <span className="text-sm leading-6 text-[var(--forge-ink-soft)]">{entry.title}</span>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl px-2 py-2.5 text-sm text-[var(--forge-muted)]">
                  No tasks yet. Start a run from the composer.
                </div>
              )}
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="rounded-[1.2rem] border border-[var(--forge-border)] bg-white p-4">
              <div className="text-base font-medium text-[var(--forge-ink)]">Share Forge with a friend</div>
              <div className="mt-1 text-sm text-[var(--forge-muted)]">Get 500 credits each</div>
              <div className="mt-3 flex items-center justify-between text-sm text-[var(--forge-ink-soft)]">
                <span>Invite</span>
                <ChevronRight className="h-4 w-4" />
              </div>
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
              <div className="text-[1.65rem] font-medium text-[var(--forge-ink)]">Forge 1.6 Lite</div>
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
