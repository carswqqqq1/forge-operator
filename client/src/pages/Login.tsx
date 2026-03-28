import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

// ─── Cloudflare Turnstile ─────────────────────────────────────────────────────
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"; // test key

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
  }
}

function useTurnstile(onSuccess: (token: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const tryRender = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onSuccess,
          theme: "light",
          size: "normal",
        });
      }
    };

    script.onload = tryRender;
    const timer = setInterval(() => {
      if (window.turnstile) { tryRender(); clearInterval(timer); }
    }, 200);

    return () => {
      clearInterval(timer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  const reset = () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  };

  return { containerRef, reset };
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────
function signInWithGoogle() {
  window.location.href = "/api/auth/google";
}

function signInWithApple() {
  window.location.href = "/api/auth/apple";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cfVerified, setCfVerified] = useState(false);

  const { containerRef: turnstileRef, reset: resetTurnstile } = useTurnstile((token) => {
    setCfToken(token);
    setCfVerified(true);
  });

  const emailLogin = trpc.auth.emailLogin?.useMutation?.({
    onSuccess: () => {
      toast.success("Signed in successfully!");
      window.location.href = "/";
    },
    onError: (e: any) => {
      toast.error(e.message || "Sign in failed");
      resetTurnstile();
      setCfToken(null);
      setCfVerified(false);
    },
  });

  const emailRegister = trpc.auth.emailRegister?.useMutation?.({
    onSuccess: () => {
      toast.success("Account created! Please sign in.");
      setMode("signin");
    },
    onError: (e: any) => {
      toast.error(e.message || "Registration failed");
      resetTurnstile();
      setCfToken(null);
      setCfVerified(false);
    },
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    if (!cfToken) { toast.error("Please complete the security check"); return; }
    setLoading(true);
    try {
      if (mode === "signin") {
        if (emailLogin) {
          await emailLogin.mutateAsync({ email, password, cfToken });
        } else {
          // Fallback: direct form post
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/auth/email/login";
          const addField = (name: string, value: string) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
          };
          addField("email", email);
          addField("password", password);
          addField("cfToken", cfToken);
          document.body.appendChild(form);
          form.submit();
        }
      } else {
        if (emailRegister) {
          await emailRegister.mutateAsync({ email, password, cfToken });
        } else {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/auth/email/register";
          const addField = (name: string, value: string) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = name;
            input.value = value;
            form.appendChild(input);
          };
          addField("email", email);
          addField("password", password);
          addField("cfToken", cfToken);
          document.body.appendChild(form);
          form.submit();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email"); return; }
    toast.success("If an account exists, a reset link has been sent.");
    setMode("signin");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-sm border border-neutral-200 px-8 py-10 flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/icon-only.png"
            alt="Forge"
            className="w-14 h-14 object-contain"
            onError={(e) => {
              // Fallback to SVG hammer icon if image fails
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="text-[22px] font-semibold text-neutral-900 tracking-tight">
            {mode === "signin" && "Sign in to Forge"}
            {mode === "signup" && "Create your Forge account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
        </div>

        {mode !== "forgot" && (
          <>
            {/* Social Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <Button
                variant="outline"
                className="w-full h-11 flex items-center gap-2.5 border border-neutral-300 rounded-lg text-[14px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                onClick={signInWithGoogle}
                type="button"
              >
                {/* Google G icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 flex items-center gap-2.5 border border-neutral-300 rounded-lg text-[14px] font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                onClick={signInWithApple}
                type="button"
              >
                {/* Apple icon */}
                <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.173 9.557c-.02-2.17 1.773-3.22 1.854-3.27-1.012-1.48-2.584-1.682-3.143-1.703-1.335-.136-2.61.79-3.287.79-.676 0-1.716-.773-2.826-.752-1.447.022-2.788.843-3.531 2.135C.717 9.31 1.81 13.5 3.37 15.78c.774 1.116 1.692 2.368 2.9 2.322 1.165-.047 1.604-.749 3.013-.749 1.41 0 1.806.749 3.037.726 1.254-.022 2.044-1.133 2.81-2.253.888-1.29 1.253-2.54 1.273-2.605-.028-.013-2.44-.935-2.463-3.664z" fill="#000"/>
                  <path d="M10.98 2.9c.637-.78 1.07-1.857.952-2.934-.92.038-2.044.617-2.706 1.39-.59.685-1.11 1.79-.972 2.843 1.027.08 2.08-.523 2.726-1.3z" fill="#000"/>
                </svg>
                Sign in with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="w-full flex items-center gap-3">
              <Separator className="flex-1 bg-neutral-200" />
              <span className="text-[12px] text-neutral-400 font-medium">Or</span>
              <Separator className="flex-1 bg-neutral-200" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-neutral-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-[14px] border-neutral-300 rounded-lg placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium text-neutral-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[12px] text-neutral-500 hover:text-neutral-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-[14px] border-neutral-300 rounded-lg pr-10 placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  {cfVerified && (
                    <div className="flex items-center gap-1.5 text-[12px] text-green-600 font-medium">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="7" fill="#22c55e"/>
                        <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Verified
                    </div>
                  )}
                  <div className="ml-auto flex items-center gap-1 text-[11px] text-neutral-400">
                    <svg width="16" height="10" viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40 0C17.9 0 0 5.8 0 13s17.9 13 40 13 40-5.8 40-13S62.1 0 40 0z" fill="#F38020"/>
                    </svg>
                    <span>Cloudflare</span>
                  </div>
                </div>
                <div ref={turnstileRef} className="w-full" />
              </div>

              <Button
                type="submit"
                disabled={loading || !cfToken}
                className="w-full h-11 bg-neutral-700 hover:bg-neutral-800 text-white text-[14px] font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {mode === "signin" ? "Signing in..." : "Creating account..."}
                  </span>
                ) : (
                  mode === "signin" ? "Sign in" : "Create account"
                )}
              </Button>
            </form>

            {/* Toggle mode */}
            <p className="text-[13px] text-neutral-500">
              {mode === "signin" ? (
                <>Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-neutral-800 font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-neutral-800 font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-email" className="text-[13px] font-medium text-neutral-700">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="mail@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-[14px] border-neutral-300 rounded-lg placeholder:text-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"
                required
                autoComplete="email"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-neutral-700 hover:bg-neutral-800 text-white text-[14px] font-medium rounded-lg transition-colors"
            >
              Send reset link
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-[13px] text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
          By continuing, you agree to Forge's{" "}
          <a href="/privacy" className="underline hover:text-neutral-600">Privacy Policy</a>
          {" & "}
          <a href="/terms" className="underline hover:text-neutral-600">Terms</a>
        </p>
      </div>
    </div>
  );
}
