"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;

export default function VerifyPage(): React.ReactElement {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(index: number, value: string): void {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>): void {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleVerify(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    // TODO: verify OTP with Supabase
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    // First-time login → collect clinical details; returning users → go straight to dashboard
    const onboarded = localStorage.getItem("clinicalDetailsComplete");
    router.push(onboarded ? "/dashboard" : "/clinical-details");
  }

  async function handleResend(): Promise<void> {
    if (resendCooldown > 0) return;
    // TODO: resend OTP
    setResendCooldown(30);
    setDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    inputRefs.current[0]?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/login"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
          aria-label="Back to login"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="text-xs text-slate-500 font-medium tracking-wider">AURA</span>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Verify Your Identity</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          We&apos;ve sent a 6-digit code to your registered device.{" "}
          Enter it below to continue.
        </p>
      </div>

      {/* OTP form */}
      <form onSubmit={handleVerify} className="flex flex-col gap-6">
        <div className="flex justify-center gap-2" aria-label="OTP input">
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
              className={cn(
                "otp-input",
                error && "border-red-500/50 focus:ring-red-500"
              )}
              aria-label={`Digit ${i + 1}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center -mt-2" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Verifying…
            </>
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
            resendCooldown > 0
              ? "text-slate-600 cursor-not-allowed"
              : "text-blue-400 hover:text-blue-300"
          )}
        >
          <RefreshCw size={14} />
          {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
        </button>
      </form>

      {/* Security note */}
      <div className="card p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Shield size={16} className="text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-300">Secure Authentication</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Your medical records are protected with bank-grade encryption.
          </p>
        </div>
      </div>

      {/* Clinic status */}
      <div className="text-center">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Clinic Status</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Precision Diagnostics Online
        </p>
      </div>
    </div>
  );
}
