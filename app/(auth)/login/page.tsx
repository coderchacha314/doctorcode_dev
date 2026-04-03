"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    if (!input.trim()) {
      setError("Please enter your email or mobile number.");
      return;
    }
    setLoading(true);
    // TODO: call Supabase auth OTP endpoint
    await new Promise((r) => setTimeout(r, 800)); // placeholder
    setLoading(false);
    router.push("/verify");
  }

  const isEmail = input.includes("@");

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 4L6 10v12l10 6 10-6V10L16 4z"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M16 4v18M6 10l10 6 10-6" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-xs text-blue-400 font-medium tracking-widest uppercase mb-1">
            Clinical Luminance
          </p>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-1">
            Secure access to your clinical ecosystem
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSendOtp} className="w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Email or Mobile
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {isEmail ? <Mail size={16} /> : <Phone size={16} />}
            </span>
            <input
              type="text"
              inputMode={isEmail ? "email" : "tel"}
              placeholder="name@clinic.com or +1 (555) 000-0000"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={cn(
                "input-field pl-10",
                error && "border-red-500/50 focus:ring-red-500/50"
              )}
              autoComplete="username"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-0.5" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Sending…
            </>
          ) : (
            "SEND OTP"
          )}
        </button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          className="btn-secondary w-full gap-2"
          onClick={() => {
            // TODO: Supabase Google OAuth
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </form>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Link
          href="/register"
          className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors"
        >
          Create Account
        </Link>
        <div className="flex gap-6 text-xs text-slate-600">
          <span>PRIVACY</span>
          <span>SECURITY</span>
          <span>HELP</span>
        </div>
      </div>
    </div>
  );
}
