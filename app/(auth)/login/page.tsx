"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSendOtp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send OTP"); return; }

      sessionStorage.setItem("otpContact", data.contact ?? email.trim());
      sessionStorage.setItem("otpType", "email");
      setSent(true);
      router.push("/verify");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(): Promise<void> {
    setGoogleLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch {
      setError("Failed to start Google sign-in.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L6 10v12l10 6 10-6V10L16 4z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
            <path d="M16 4v18M6 10l10 6 10-6" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-500 dark:text-blue-400 font-medium tracking-widest uppercase mb-1">Clinical Luminance</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Secure access to your clinical ecosystem</p>
        </div>
      </div>

      {/* Google SSO */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border font-medium text-sm transition-all duration-150 disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-surface)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      >
        {googleLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full -mt-4">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-divider)" }} />
        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>or sign in with email</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-divider)" }} />
      </div>

      {/* Email OTP Form */}
      <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4 -mt-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
              <Mail size={16} />
            </span>
            <input
              type="email"
              inputMode="email"
              placeholder="name@clinic.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className={cn("input-field pl-10", error && "border-red-500/50")}
              autoComplete="email"
              autoFocus
              disabled={sent}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs" role="alert">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading || sent}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" />Sending OTP…</>
          ) : (
            "SEND OTP VIA EMAIL"
          )}
        </button>
      </form>

      <div className="flex flex-col items-center gap-4 w-full">
        <Link href="/register" className="text-blue-500 dark:text-blue-400 text-sm font-medium hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
          Create Account
        </Link>
        <div className="flex gap-6 text-xs" style={{ color: "var(--color-text-dim)" }}>
          <span>PRIVACY</span><span>SECURITY</span><span>HELP</span>
        </div>
      </div>
    </div>
  );
}
