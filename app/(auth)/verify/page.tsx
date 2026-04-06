"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const OTP_LENGTH = 6;

export default function VerifyPage(): React.ReactElement {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const [contact, setContact] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("otpContact") ?? "";
    if (!stored) {
      router.replace("/login");
      return;
    }
    setContact(stored);
    inputRefs.current[0]?.focus();
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleChange(i: number, value: string): void {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setError("");
    if (d && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>): void {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    for (let i = 0; i < p.length; i++) next[i] = p[i];
    setDigits(next);
    inputRefs.current[Math.min(p.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleVerify(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    if (!contact) {
      setError("Session expired. Please go back and try again.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();

      const { error: otpError } = await supabase.auth.verifyOtp({
        email: contact,
        token: otp,
        type: "email",
      });

      if (otpError) {
        setError(otpError.message ?? "Invalid or expired code");
        return;
      }

      const res = await fetch("/api/auth/ensure-profile", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to complete setup. Please try again.");
        return;
      }

      sessionStorage.removeItem("otpContact");
      sessionStorage.removeItem("otpType");
      router.push(data.onboardingComplete ? "/dashboard" : "/clinical-details");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (resendCooldown > 0 || !contact) return;
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });
    } catch {
      // silent fail
    }
    setResendCooldown(30);
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    inputRefs.current[0]?.focus();
  }

  const maskedContact = contact
    ? contact.replace(/^(.{1,2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, "*") + c)
    : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-xs font-medium tracking-wider" style={{ color: "var(--color-text-dim)" }}>AURA</span>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Verify Your Identity</h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          We&apos;ve sent a 6-digit code to your email
        </p>
        {maskedContact && (
          <p className="text-sm font-semibold mt-0.5 text-blue-500 dark:text-blue-400">
            {maskedContact}
          </p>
        )}
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={cn("otp-input", error && "border-red-500/50 focus:ring-red-500")}
              aria-label={`Digit ${i + 1}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center -mt-2" role="alert">{error}</p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" />Verifying…</>
          ) : (
            "VERIFY"
          )}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className={cn(
            "flex items-center justify-center gap-2 text-sm font-medium transition-colors mx-auto",
            resendCooldown > 0 ? "cursor-not-allowed" : "text-blue-500 dark:text-blue-400"
          )}
          style={resendCooldown > 0 ? { color: "var(--color-text-dim)" } : {}}
        >
          <RefreshCw size={14} />
          {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
        </button>
      </form>

      <div className="card p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield size={16} className="text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-2)" }}>Secure Authentication</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Your medical records are protected with bank-grade encryption.
          </p>
        </div>
      </div>
    </div>
  );
}
