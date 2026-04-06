"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Loader2, Lock, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Gender = "Male" | "Female" | "Other";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1",  label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
];

interface FormData {
  dob: string;
  weight: string;
  height: string;
  gender: Gender | "";
  countryCode: string;
  mobile: string;
  pastMedicalHistory: string;
  currentMedications: string;
}

interface FormErrors {
  dob?: string;
  weight?: string;
  height?: string;
  gender?: string;
}

function calcBMI(weight: string, height: string): string {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100;
  if (!w || !h || h <= 0) return "";
  return (w / (h * h)).toFixed(1);
}

function bmiLabel(bmi: string): { text: string; cls: string } | null {
  const v = parseFloat(bmi);
  if (isNaN(v)) return null;
  if (v < 18.5) return { text: "UNDERWEIGHT", cls: "bg-violet-500/20 text-violet-400 border-violet-500/30" };
  if (v < 25)   return { text: "NORMAL",      cls: "bg-green-500/20 text-green-400 border-green-500/30" };
  if (v < 30)   return { text: "OVERWEIGHT",  cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  return           { text: "OBESE",        cls: "bg-red-500/20 text-red-400 border-red-500/30" };
}

export default function ClinicalDetailsPage(): React.ReactElement {
  const [form, setForm] = useState<FormData>({
    dob: "", weight: "", height: "",
    gender: "", countryCode: "+91", mobile: "",
    pastMedicalHistory: "", currentMedications: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    fetch("/api/settings/clinical-details")
      .then((r) => r.json())
      .then((data) => {
        const patient = data.patient;
        if (!patient) return;
        if (patient.onboardingComplete) { router.replace("/dashboard"); return; }
        setForm((f) => ({
          ...f,
          dob: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().slice(0, 10) : "",
          weight: patient.weight != null ? String(patient.weight) : "",
          height: patient.height != null ? String(patient.height) : "",
        }));
      })
      .catch(() => {})
      .finally(() => setCheckingOnboarding(false));

    // Pre-fill gender/mobile from profile
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((data) => {
        const profile = data.profile;
        if (!profile) return;
        if (profile.gender) setForm((f) => ({ ...f, gender: profile.gender as Gender }));
        if (profile.mobile) {
          const raw = profile.mobile as string;
          const cc = COUNTRY_CODES.find((c) => raw.startsWith(c.code));
          if (cc) setForm((f) => ({ ...f, countryCode: cc.code, mobile: raw.slice(cc.code.length) }));
          else setForm((f) => ({ ...f, mobile: raw }));
        }
      })
      .catch(() => {});
  }, [router]);

  const bmi = calcBMI(form.weight, form.height);
  const bmiInfo = bmiLabel(bmi);

  function update<K extends keyof FormData>(field: K, value: FormData[K]): void {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.dob)    errs.dob    = "Date of birth is required.";
    if (!form.weight) errs.weight = "Weight is required.";
    if (!form.height) errs.height = "Height is required.";
    if (!form.gender) errs.gender = "Please select a gender.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const fullMobile = form.mobile.trim()
        ? `${form.countryCode}${form.mobile.replace(/[\s\-]/g, "")}`
        : undefined;

      const res = await fetch("/api/settings/clinical-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: form.dob || undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          height: form.height ? parseFloat(form.height) : undefined,
          gender: form.gender || undefined,
          mobile: fullMobile,
          pastMedicalHistory: form.pastMedicalHistory || undefined,
          currentMedications: form.currentMedications || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ dob: data.error });
        return;
      }
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setErrors({ dob: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (checkingOnboarding) {
    return (
      <div className="flex flex-col min-h-dvh items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh transition-colors duration-200" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="w-9 h-9" />
        <h1 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Clinical Details</h1>
        <button className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--color-text-dim)" }}>
          <span>Onboarding</span><span>Step 2 of 2</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-overlay)" }}>
          <div className="h-full w-full rounded-full bg-blue-500 transition-all" />
        </div>
      </div>

      {/* Intro */}
      <div className="px-4 mb-6">
        <div className="card p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Lock size={15} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Health Profile Setup</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Your clinical data is encrypted and never shared without your consent.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 flex flex-col gap-5 pb-8">

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
            Gender <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["Male", "Female", "Other"] as Gender[]).map((g) => (
              <button
                key={g} type="button"
                onClick={() => update("gender", g)}
                className={cn(
                  "py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[48px]",
                  form.gender === g ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "border"
                )}
                style={form.gender !== g ? {
                  backgroundColor: "var(--color-input)",
                  borderColor: errors.gender ? "rgba(239,68,68,0.5)" : "var(--color-border)",
                  color: "var(--color-text-muted)",
                } : {}}
              >
                {g}
              </button>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-xs" role="alert">{errors.gender}</p>}
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
            Mobile Number <span className="text-xs normal-case font-normal" style={{ color: "var(--color-text-dim)" }}>(optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={form.countryCode}
              onChange={(e) => update("countryCode", e.target.value)}
              className="input-field w-28 flex-shrink-0 px-2 text-sm"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }}>
                <Phone size={16} />
              </span>
              <input
                type="tel" inputMode="numeric" placeholder="9876543210"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value.replace(/[^\d\s\-]/g, ""))}
                className="input-field pl-10"
                autoComplete="tel-national"
              />
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date" value={form.dob}
            onChange={(e) => update("dob", e.target.value)}
            className={cn("input-field", errors.dob && "border-red-500/50")}
          />
          {errors.dob && <p className="text-red-500 text-xs" role="alert">{errors.dob}</p>}
        </div>

        {/* Weight + Height */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
              Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" inputMode="decimal" placeholder="70"
              value={form.weight}
              onChange={(e) => update("weight", e.target.value)}
              className={cn("input-field", errors.weight && "border-red-500/50")}
            />
            {errors.weight && <p className="text-red-500 text-xs" role="alert">{errors.weight}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
              Height (cm) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" inputMode="decimal" placeholder="170"
              value={form.height}
              onChange={(e) => update("height", e.target.value)}
              className={cn("input-field", errors.height && "border-red-500/50")}
            />
            {errors.height && <p className="text-red-500 text-xs" role="alert">{errors.height}</p>}
          </div>
        </div>

        {/* BMI preview */}
        {bmi && bmiInfo && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>BMI</span>
            <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{bmi}</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", bmiInfo.cls)}>
              {bmiInfo.text}
            </span>
          </div>
        )}

        {/* Past Medical History */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
            Past Medical History
          </label>
          <textarea
            rows={3} placeholder="e.g. Hypertension, Type 2 Diabetes…"
            value={form.pastMedicalHistory}
            onChange={(e) => update("pastMedicalHistory", e.target.value)}
            className="input-field resize-none"
          />
        </div>

        {/* Current Medications */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>
            Current Medications
          </label>
          <textarea
            rows={3} placeholder="e.g. Metformin 500mg, Lisinopril 10mg…"
            value={form.currentMedications}
            onChange={(e) => update("currentMedications", e.target.value)}
            className="input-field resize-none"
          />
        </div>

        <button type="submit" className="btn-primary w-full mt-2" disabled={saving || saved}>
          {saved ? "Saved! Redirecting…" : saving ? (
            <><Loader2 size={16} className="animate-spin mr-2" />Saving…</>
          ) : "Complete Setup →"}
        </button>
      </form>
    </div>
  );
}
