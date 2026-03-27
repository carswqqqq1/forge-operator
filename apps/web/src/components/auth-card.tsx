"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { ForgeLogo } from "./forge-logo";

type AuthCardProps = {
  variant: "sign-in" | "sign-up" | "forgot-password";
  title: string;
  subtitle: string;
  alternateLabel: string;
  alternateHref: string;
};

export function AuthCard({ variant, title, subtitle, alternateLabel, alternateHref }: AuthCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const client = getSupabaseBrowser();

    if (!client) {
      setError("Supabase isn’t configured yet. Add your public URL and anon key to enable auth.");
      return;
    }

    if (!email) {
      setError("Enter your email to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (variant === "sign-in") {
        const { error: signInError } = await client.auth.signInWithPassword({ email, password });

        if (signInError) {
          throw signInError;
        }

        router.push("/workspace");
        router.refresh();
        return;
      }

      if (variant === "sign-up") {
        const { error: signUpError } = await client.auth.signUp({ email, password });

        if (signUpError) {
          throw signUpError;
        }

        setMessage("Account created. Check your inbox to confirm your email, then come back and sign in.");
        return;
      }

      const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/sign-in`,
      });

      if (resetError) {
        throw resetError;
      }

      setMessage("Password reset email sent. Check your inbox for the secure link.");
    } catch (caughtError) {
      const nextError = caughtError instanceof Error ? caughtError.message : "Unable to complete authentication.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    const client = getSupabaseBrowser();

    if (!client) {
      setError("Supabase isn’t configured yet. Add your public URL and anon key to enable auth.");
      return;
    }

    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/workspace`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <div className="forge-dots flex min-h-screen items-center justify-center bg-[var(--forge-bg-soft)] px-4 py-10 text-[var(--forge-ink)]">
      <div className="w-full max-w-[420px]">
        <div className="mb-10">
          <ForgeLogo />
        </div>
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <ForgeLogo compact />
          </div>
          <h1 className="text-[2.35rem] font-semibold tracking-[-0.04em]">{title}</h1>
          <p className="mt-2 text-base leading-7 text-[var(--forge-muted)]">{subtitle}</p>
        </div>

        <div className="space-y-4">
          <input
            className="h-12 w-full rounded-2xl border border-[var(--forge-border)] bg-white px-4 text-[var(--forge-ink)] outline-none placeholder:text-[var(--forge-muted)]"
            placeholder="Work email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {variant !== "forgot-password" ? (
            <input
              className="h-12 w-full rounded-2xl border border-[var(--forge-border)] bg-white px-4 text-[var(--forge-ink)] outline-none placeholder:text-[var(--forge-muted)]"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          ) : null}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-12 w-full rounded-2xl bg-[var(--forge-accent)] text-sm font-medium tracking-[0.02em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Working..." : variant === "forgot-password" ? "Send reset link" : "Continue"}
          </button>
          {message ? <p className="text-sm leading-6 text-[#5d8354]">{message}</p> : null}
          {error ? <p className="text-sm leading-6 text-[#925555]">{error}</p> : null}
        </div>

        {variant !== "forgot-password" ? (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-[var(--forge-border)]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[var(--forge-muted)]">or</span>
              <div className="h-px flex-1 bg-[var(--forge-border)]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="rounded-2xl border border-[var(--forge-border)] bg-white px-4 py-3 text-sm text-[var(--forge-ink-soft)] transition hover:bg-[var(--forge-chip)]"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className="rounded-2xl border border-[var(--forge-border)] bg-white px-4 py-3 text-sm text-[var(--forge-ink-soft)] transition hover:bg-[var(--forge-chip)]"
              >
                Continue with GitHub
              </button>
            </div>
          </>
        ) : null}

        <div className="mt-8 flex items-center justify-between text-sm text-[var(--forge-muted)]">
          {variant !== "forgot-password" ? (
            <Link href="/auth/forgot-password" className="transition hover:text-[var(--forge-ink)]">
              Forgot password
            </Link>
          ) : (
            <span>Secure recovery</span>
          )}
          <Link href={alternateHref} className="transition hover:text-[var(--forge-ink)]">
            {alternateLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
