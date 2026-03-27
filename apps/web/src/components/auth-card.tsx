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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_32%),linear-gradient(180deg,#0b0c0f_0%,#111216_35%,#121318_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-[520px] rounded-[2.2rem] border border-white/10 bg-white/5 p-8 shadow-[0_40px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div className="mb-10">
          <ForgeLogo />
        </div>
        <div className="mb-8">
          <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/36">Account</div>
          <h1 className="font-[family-name:var(--font-serif)] text-5xl tracking-[-0.05em]">{title}</h1>
          <p className="mt-3 text-base leading-7 text-white/56">{subtitle}</p>
        </div>

        <div className="space-y-4">
          <input
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-white/28"
            placeholder="Work email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {variant !== "forgot-password" ? (
            <input
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-white/28"
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
            className="h-14 w-full rounded-2xl bg-[#d3ff63] text-sm font-medium tracking-[0.02em] text-black transition hover:bg-[#e0ff8f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Working..." : variant === "forgot-password" ? "Send reset link" : "Continue"}
          </button>
          {message ? <p className="text-sm leading-6 text-[var(--forge-lime)]">{message}</p> : null}
          {error ? <p className="text-sm leading-6 text-rose-200/90">{error}</p> : null}
        </div>

        {variant !== "forgot-password" ? (
          <>
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-xs uppercase tracking-[0.28em] text-white/30">or</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72 transition hover:bg-white/9">
                Continue with Google
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/72 transition hover:bg-white/9">
                Continue with GitHub
              </button>
            </div>
          </>
        ) : null}

        <div className="mt-8 flex items-center justify-between text-sm text-white/48">
          {variant !== "forgot-password" ? (
            <Link href="/auth/forgot-password" className="transition hover:text-white">
              Forgot password
            </Link>
          ) : (
            <span>Secure recovery</span>
          )}
          <Link href={alternateHref} className="transition hover:text-white">
            {alternateLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
