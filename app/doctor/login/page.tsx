"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DoctorLoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // ── Dev bypass: admin / admin ─────────────────────────────────────────
      if (process.env.NEXT_PUBLIC_DEV_DOCTOR_BYPASS === "true" && email.trim() === "admin" && password === "admin") {
        router.push("/doctor/dashboard");
        return;
      }

      // ── Normal Supabase auth ──────────────────────────────────────────────
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const res = await fetch("/api/doctor/auth/ensure-profile", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        await supabase.auth.signOut();
        setError(data.error ?? "This account is not registered as a doctor.");
        return;
      }

      router.push("/doctor/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Stethoscope size={28} className="text-white" />
          </div>
          <div className="text-center">
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium tracking-widest uppercase mb-1">
              Doctor Portal
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              Doctor Sign In
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Access your clinical dashboard
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
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
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className={cn("input-field pl-10", error && "border-red-500/50")}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className={cn("input-field pl-10", error && "border-red-500/50")}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl px-6 py-3 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Signing In…</>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 w-full">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            New doctor?{" "}
            <Link href="/doctor/register" className="text-emerald-500 dark:text-emerald-400 font-medium hover:text-emerald-600 dark:hover:text-emerald-300">
              Create Doctor Account
            </Link>
          </p>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: "var(--color-divider)" }} />
            <Link href="/login" className="text-xs" style={{ color: "var(--color-text-dim)" }}>
              Patient Login
            </Link>
            <div className="h-px flex-1" style={{ backgroundColor: "var(--color-divider)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
