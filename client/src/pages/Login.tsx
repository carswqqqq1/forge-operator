import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try { window.location.href = "/api/auth/google"; } catch { setLoading(false); }
  };

  const handleEmailContinue = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ email, password: "", cfToken: "" }),
      });
      if (res.ok) { toast.success("Signed in!"); window.location.href = "/"; return; }
    } catch {}
    setLocation("/");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f5f2]">
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <img src="/icon-only.png" alt="Forge" className="h-6 w-6" />
        <span className="font-serif text-lg font-semibold tracking-[-0.03em] text-[#1a1816]">forge</span>
      </div>

      <div className="w-full max-w-[400px] px-6">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a1816]">
            <img src="/icon-only.png" alt="Forge" className="h-8 w-8 brightness-0 invert" />
          </div>
        </div>

        <h1 className="text-center text-[22px] font-semibold tracking-[-0.02em] text-[#1a1816]">Sign in or sign up</h1>
        <p className="mt-1.5 text-center text-[14px] text-[#7a746c]">Start creating with Forge</p>

        <div className="mt-8 space-y-3">
          <button onClick={() => {}} className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-[14px] font-medium text-[#1a1816] transition-colors hover:bg-[#faf9f6]">
            <FacebookIcon /><span>Continue with Facebook</span>
          </button>
          <button onClick={signInWithGoogle} className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-[14px] font-medium text-[#1a1816] transition-colors hover:bg-[#faf9f6]">
            <GoogleIcon /><span>Continue with Google</span>
          </button>
          <button onClick={() => {}} className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-[14px] font-medium text-[#1a1816] transition-colors hover:bg-[#faf9f6]">
            <MicrosoftIcon /><span>Continue with Microsoft</span>
          </button>
          <button onClick={() => { window.location.href = "/api/auth/apple"; }} className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-[14px] font-medium text-[#1a1816] transition-colors hover:bg-[#faf9f6]">
            <AppleIcon /><span>Continue with Apple</span>
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e8e4dc]" />
          <span className="text-xs text-[#7a746c]">Or</span>
          <div className="h-px flex-1 bg-[#e8e4dc]" />
        </div>

        <div className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c] transition-colors" />
          <div className="flex items-center gap-2 rounded-lg border border-[#e8e4dc] bg-[#faf9f6] px-3 py-2.5">
            <div className="h-5 w-5 rounded border border-[#ddd8cf] bg-white" />
            <span className="text-xs text-[#7a746c]">Verify you are human</span>
          </div>
          <button onClick={handleEmailContinue} disabled={!email.trim() || loading} className={`flex w-full items-center justify-center rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${email.trim() && !loading ? "bg-[#1a1816] text-white hover:opacity-90" : "bg-[#ece9e3] text-[#b8b3ab] cursor-not-allowed"}`}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[#7a746c]">
          <span>from</span><span className="font-semibold">Forge</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#7a746c]">
          <a href="#" className="hover:text-[#36322d] transition-colors">Terms of service</a>
          <a href="#" className="hover:text-[#36322d] transition-colors">Privacy policy</a>
        </div>
      </div>
    </div>
  );
}
