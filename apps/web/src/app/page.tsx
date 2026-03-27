import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ForgeLogo } from "@/components/forge-logo";
import { PromptComposer } from "@/components/prompt-composer";

const quickLinks = ["Create slides", "Build website", "Develop desktop apps", "Design", "More"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--forge-bg)] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1380px]">
        <header className="mb-4 flex items-center justify-between rounded-[1.25rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-5 py-3">
          <ForgeLogo />
          <nav className="hidden items-center gap-8 text-sm text-[var(--forge-ink-soft)] lg:flex">
            <Link href="/workspace">Features</Link>
            <Link href="/settings">Resources</Link>
            <Link href="/billing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in" className="rounded-xl bg-[var(--forge-accent)] px-4 py-2 text-sm font-medium text-white">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="rounded-xl border border-[var(--forge-border)] bg-white px-4 py-2 text-sm text-[var(--forge-ink)]">
              Sign up
            </Link>
          </div>
        </header>
        <div className="mb-8 rounded-2xl border border-[var(--forge-border)] bg-[var(--forge-chip)] px-5 py-3 text-center text-sm text-[var(--forge-ink-soft)]">
          Forge is building the execution layer for AI workspaces and browser operators
          <ArrowRight className="ml-2 inline h-4 w-4" />
        </div>

        <section className="flex min-h-[70vh] flex-col items-center justify-center pb-16 pt-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--forge-border)] bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--forge-muted)]">
              <Sparkles className="h-3.5 w-3.5 text-[var(--forge-blue)]" />
              Forge v1
          </div>
          <h1 className="max-w-[14ch] text-center font-[family-name:var(--font-serif)] text-6xl leading-none tracking-[-0.06em] text-[var(--forge-ink)] sm:text-7xl">
            What can I do for you?
          </h1>
          <div className="mt-10 w-full max-w-[720px]">
            <PromptComposer />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
        </section>
      </div>
    </main>
  );
}
