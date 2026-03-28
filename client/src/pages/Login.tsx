import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        theme?: "light" | "dark";
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const oauthPortalEnabled = Boolean(import.meta.env.VITE_OAUTH_PORTAL_URL && import.meta.env.VITE_APP_ID);

function ForgeMark() {
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-foreground" fill="none" aria-hidden="true">
      <path
        d="M22.5 16.5c2.8-2.2 6.4-1.8 8.7.5l2.5 2.8c1.2 1.3 1.5 3.1 1 4.7l5.2 6c2 2.3 2 5.8-.2 8.1-2.4 2.4-6.2 2.4-8.6 0l-6.4-6.5-2.4 2.1c-2.2 1.9-5.5 1.7-7.5-.4-2-2.2-1.9-5.7.4-7.7l2.2-2-3.3-3.7c-2.1-2.3-1.9-5.9.5-8.1 2.3-2 5.8-1.9 7.9.2Z"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 17.8 31.3 27m-12.8-.9 7.6-6.8m9.6 12.1 7.6-6.7"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M41.8 11.5v7.4M38.1 15.2h7.4M48.5 18.8v4.4M46.3 21h4.4" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}

function BrandWordmark() {
  return (
    <div className="flex items-center gap-2.5 text-foreground">
      <div className="scale-[0.82]">
        <ForgeMark />
      </div>
      <span className="font-serif text-[2rem] font-semibold tracking-[-0.055em]">forge</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.6-.1-1.2-.2-1.7H12Z" />
      <path fill="#34A853" d="M12 21c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4H3.4v2.5A9.67 9.67 0 0 0 12 21Z" />
      <path fill="#4A90E2" d="M6.6 13c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V6.7H3.4A9.58 9.58 0 0 0 2.4 11c0 1.5.4 2.9 1 4.3l3.2-2.3Z" />
      <path fill="#FBBC05" d="M12 5.1c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.1 14.6 1 12 1A9.67 9.67 0 0 0 3.4 6.7L6.6 9c.7-2.3 2.9-3.9 5.4-3.9Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path d="M13.2 18v-5h1.8l.3-2h-2.1V9.8c0-.6.2-1.1 1.1-1.1h1.1V7c-.2 0-.9-.1-1.8-.1-1.8 0-3 1.1-3 3.1V11H8.8v2h1.8v5h2.6Z" fill="#fff" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.1 3.4c0 1-.4 1.9-1 2.6-.8.9-1.9 1.4-3 1.3-.1-1 .3-2 1-2.7.8-.8 2-1.4 3-1.2ZM18.7 16.8c-.5 1.1-.8 1.6-1.5 2.5-1 1.3-2.3 2.8-3.9 2.8-1.4 0-1.8-.9-3.7-.9-1.9 0-2.3.9-3.7 1-1.6 0-2.8-1.4-3.8-2.7C-.6 15.9.4 11.5 3 10c1.1-.7 2.5-1.1 3.8-1.1 1.5 0 2.5 1 3.7 1 1.2 0 2-.9 3.6-.9 1.1 0 2.3.3 3.3.9-.3.8-.4 1.2-.4 2 0 2.2 1.9 3.3 1.9 3.4-.1.1-.3 1-.2 1.5Z"
      />
    </svg>
  );
}

const socialProviders = [
  { name: "Facebook", key: "facebook", icon: <FacebookIcon /> },
  { name: "Google", key: "google", icon: <GoogleIcon /> },
  { name: "Microsoft", key: "microsoft", icon: <MicrosoftIcon /> },
  { name: "Apple", key: "apple", icon: <AppleIcon /> },
];

function TurnstileBox() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!turnstileSiteKey || !containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.turnstile || !containerRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        callback: () => setVerified(true),
        "expired-callback": () => setVerified(false),
        theme: "light",
      });
    };

    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      document.head.removeChild(script);
    };
  }, []);

  if (!turnstileSiteKey) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md border border-border bg-background" />
          <span className="text-sm text-foreground">Verify you are human</span>
        </div>
        <div className="text-right text-[10px] leading-4 text-muted-foreground">
          <div className="font-semibold tracking-[0.18em] text-foreground/80">CLOUDFLARE</div>
          <div>Add `VITE_TURNSTILE_SITE_KEY`</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white px-3 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.03)]">
      <div ref={containerRef} />
      {verified ? <div className="mt-2 text-xs text-emerald-600">Verification complete</div> : null}
    </div>
  );
}

export default function Login() {
  const footerLabel = useMemo(() => "Forge Labs", []);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completeLocalLogin = async (provider: string, customEmail?: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          email: customEmail,
        }),
      });
      if (!response.ok) {
        throw new Error("Sign-in failed");
      }
      toast.success(`Signed in with ${provider.charAt(0).toUpperCase()}${provider.slice(1)}`);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error("Could not sign you in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderLogin = async (provider: string) => {
    if (oauthPortalEnabled) {
      window.location.href = getLoginUrl({ provider: provider as any, type: "signIn" });
      return;
    }
    await completeLocalLogin(provider);
  };

  const handleEmailContinue = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }
    if (oauthPortalEnabled) {
      window.location.href = getLoginUrl({
        provider: "email",
        type: "signIn",
        email: email.trim(),
      });
      return;
    }
    await completeLocalLogin("email", email.trim());
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbfaf7] px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(229,241,255,0.95),rgba(251,250,247,0.55)_18%,rgba(251,250,247,1)_58%)]" />
      <div className="pointer-events-none absolute inset-0 forge-login-dots opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-120px] h-[220px] bg-[radial-gradient(circle_at_center,rgba(154,200,255,0.36),transparent_65%)] blur-3xl" />

      <div className="absolute left-10 top-8">
        <BrandWordmark />
      </div>

      <div className="relative z-10 w-full max-w-[360px]">
        <div className="mb-9 flex flex-col items-center text-center">
          <div className="mb-4 text-foreground">
            <ForgeMark />
          </div>
          <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-foreground">Sign in or sign up</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start creating with Forge</p>
        </div>

        <div className="space-y-2">
          {socialProviders.map((provider) => (
            <button
              key={provider.name}
              type="button"
              onClick={() => void handleProviderLogin(provider.key)}
              disabled={submitting}
              className="relative flex h-11 w-full items-center justify-center rounded-[14px] border border-[#e5e2dc] bg-white px-4 text-sm font-medium text-[#353535] shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition-colors hover:bg-[#f7f6f2]"
            >
              <span className="absolute left-6 flex h-4 w-4 items-center justify-center text-foreground">{provider.icon}</span>
              <span>Continue with {provider.name}</span>
            </button>
          ))}
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e8e5df]" />
          <span className="text-sm text-muted-foreground">Or</span>
          <div className="h-px flex-1 bg-[#e8e5df]" />
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleEmailContinue();
              }
            }}
            placeholder="Enter your email address"
            className="h-11 rounded-[14px] border-[#e5e2dc] bg-white text-sm shadow-[0_1px_1px_rgba(15,23,42,0.02)] placeholder:text-[#a7a39b]"
          />

          <TurnstileBox />

          <Button
            type="button"
            disabled={submitting}
            onClick={() => void handleEmailContinue()}
            className="h-11 w-full rounded-[14px] bg-[#8d8d8d] text-sm font-medium text-white hover:bg-[#7c7c7c]"
          >
            Continue
          </Button>
        </div>

        <div className="mt-14 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <div>from</div>
          <div className="text-base font-semibold tracking-[-0.03em] text-foreground">{footerLabel}</div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Terms of service
          </Link>
          <Link href="/" className="underline-offset-4 hover:underline">
            Privacy policy
          </Link>
          <span>©2026 Forge</span>
        </div>
      </div>
    </div>
  );
}
