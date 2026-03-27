import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PromptComposer } from "@/components/prompt-composer";
import { Bot, X } from "lucide-react";

const quickLinks = ["Create slides", "Build website", "Develop desktop apps", "Design", "More"];

export default function WorkspacePage() {
  return (
    <AppShell title="What can I do for you?" subtitle="Launch async work, inspect live runs, and keep every artifact in one premium workspace.">
      <div className="flex min-h-[calc(100vh-90px)] flex-col items-center pt-18">
        <h1 className="max-w-[12ch] text-center font-[family-name:var(--font-serif)] text-[4.2rem] leading-[0.95] tracking-[-0.06em] text-[var(--forge-ink)]">
          What can I do for you?
        </h1>

        <div className="mt-10 w-full max-w-[700px] rounded-[1.8rem] border border-[var(--forge-border)] bg-white shadow-[0_10px_30px_rgba(35,32,29,0.04)]">
          <div className="p-4">
            <PromptComposer compact />
          </div>
          <div className="flex items-center justify-between border-t border-[var(--forge-border)] bg-[#eef5ff] px-4 py-3 text-sm text-[var(--forge-ink-soft)]">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[var(--forge-blue)]" />
              <span>Your task on Forge Desktop consumes 50% fewer credits</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/billing" className="font-medium text-[var(--forge-blue)]">Download now</Link>
              <X className="h-4 w-4 text-[var(--forge-muted)]" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item}
              href="/workspace"
              className="rounded-full border border-[var(--forge-border)] bg-white px-4 py-2.5 text-sm text-[var(--forge-ink-soft)] transition hover:bg-[var(--forge-chip)]"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="mt-28 w-full max-w-[650px] rounded-[1.6rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] p-4">
          <div className="grid grid-cols-[1.5fr_0.8fr] gap-4">
            <div className="p-4">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[var(--forge-ink)]">Download Forge for Windows or macOS</div>
              <div className="mt-2 max-w-[28ch] text-lg leading-8 text-[var(--forge-muted)]">
                Access local files and work seamlessly with your desktop runner.
              </div>
            </div>
            <div className="rounded-[1.2rem] border border-[var(--forge-border)] bg-white p-4">
              <div className="rounded-xl border border-[var(--forge-border)] bg-[var(--forge-bg)] p-3">
                <div className="mb-3 flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#f87171]" />
                  <span className="h-2 w-2 rounded-full bg-[#fbbf24]" />
                  <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                </div>
                <div className="font-[family-name:var(--font-serif)] text-xl tracking-[-0.04em] text-[var(--forge-ink)]">What can I do for you?</div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[var(--forge-border-strong)]">
            <span className="h-2 w-2 rounded-full bg-[var(--forge-border-strong)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--forge-border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--forge-border)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--forge-border)]" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
