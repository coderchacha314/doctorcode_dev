"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Gender = "Male" | "Female" | "Other";

interface FormErrors {
  fullName?: string;
  mobile?: string;
}

export default function RegisterPage(): React.ReactElement {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!mobile.trim()) errs.mobile = "Mobile number is required.";
    else if (!/^\+?[\d\s\-().]{7,}$/.test(mobile))
      errs.mobile = "Enter a valid mobile number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // TODO: call registration API / Supabase auth
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push("/verify");
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-blue-700/30 border border-blue-500/30 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 4L6 10v12l10 6 10-6V10L16 4z"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M16 4v18M6 10l10 6 10-6" stroke="#60a5fa" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Join Clinical Luminance for premium medical care
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <User size={16} />
            </span>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={cn(
                "input-field pl-10",
                errors.fullName && "border-red-500/50"
              )}
              autoComplete="name"
              autoFocus
            />
          </div>
          {errors.fullName && (
            <p className="text-red-400 text-xs" role="alert">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Mobile Number
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Phone size={16} />
            </span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+1 (555) 000-0000"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className={cn(
                "input-field pl-10",
                errors.mobile && "border-red-500/50"
              )}
              autoComplete="tel"
            />
          </div>
          {errors.mobile && (
            <p className="text-red-400 text-xs" role="alert">
              {errors.mobile}
            </p>
          )}
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Gender
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["Male", "Female", "Other"] as Gender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={cn(
                  "py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[48px]",
                  gender === g
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "bg-[#152540] text-slate-400 hover:bg-[#1a2d4e] border border-white/5"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center leading-relaxed">
          By registering, you agree to our{" "}
          <span className="text-blue-400">Terms of Service</span> and{" "}
          <span className="text-blue-400">Privacy Policy</span> regarding your
          clinical data.
        </p>

        <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Creating account…
            </>
          ) : (
            "Register & Continue →"
          )}
        </button>
      </form>

      <p className="text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-400 font-medium hover:text-blue-300">
          Log In
        </Link>
      </p>
    </div>
  );
}
