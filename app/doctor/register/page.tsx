"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Stethoscope, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export default function DoctorRegisterPage(): React.ReactElement {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email.";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/doctor/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), password, specialty: specialty.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Registration failed"); return; }

      // Registration successful — redirect to login
      router.push("/doctor/login?registered=1");
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const specialties = [
    "General Practice", "Cardiology", "Endocrinology", "Nephrology",
    "Neurology", "Oncology", "Pediatrics", "Psychiatry", "Radiology", "Surgery", "Other",
  ];

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

      <div className="relative w-full max-w-sm flex flex-col items-center gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border border-emerald-500/30 flex items-center justify-center">
            <Stethoscope size={24} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium tracking-widest uppercase mb-1">
              Doctor Portal
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Create Doctor Account</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
              Register to manage your patients
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Full Name
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={cn("input-field pl-10", errors.fullName && "border-red-500/50")}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs" role="alert">{errors.fullName}</p>}
          </div>

          {/* Email */}
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
                onChange={(e) => setEmail(e.target.value)}
                className={cn("input-field pl-10", errors.email && "border-red-500/50")}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs" role="alert">{errors.email}</p>}
          </div>

          {/* Password */}
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("input-field pl-10", errors.password && "border-red-500/50")}
                autoComplete="new-password"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs" role="alert">{errors.password}</p>}
          </div>

          {/* Specialty */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Specialty (optional)
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="input-field"
              style={{ color: specialty ? "var(--color-text)" : "var(--color-text-muted)" }}
            >
              <option value="">Select specialty…</option>
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {apiError && (
            <p className="text-red-500 text-xs text-center" role="alert">{apiError}</p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl px-6 py-3 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" />Creating Account…</>
            ) : (
              "Create Doctor Account"
            )}
          </button>
        </form>

        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Already registered?{" "}
          <Link href="/doctor/login" className="text-emerald-500 dark:text-emerald-400 font-medium hover:text-emerald-600 dark:hover:text-emerald-300">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
