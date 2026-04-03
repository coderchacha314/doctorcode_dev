"use client";

import { useState, useEffect } from "react";
import { MoreVertical, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FormData {
  dob: string;
  weight: string;
  height: string;
  pastMedicalHistory: string;
  currentMedications: string;
}

interface FormErrors {
  dob?: string;
  weight?: string;
  height?: string;
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
    dob: "",
    weight: "",
    height: "",
    pastMedicalHistory: "",
    currentMedications: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // If user already completed onboarding, skip straight to dashboard
  useEffect(() => {
    if (localStorage.getItem("clinicalDetailsComplete")) {
      router.replace("/dashboard");
    }
  }, [router]);

  const bmi = calcBMI(form.weight, form.height);
  const bmiInfo = bmiLabel(bmi);

  function update(field: keyof FormData, value: string): void {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.dob)    errs.dob    = "Date of birth is required.";
    if (!form.weight) errs.weight = "Weight is required.";
    if (!form.height) errs.height = "Height is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    // TODO: PATCH /api/settings/clinical-details
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    // Mark onboarding complete so this screen is skipped on future logins
    localStorage.setItem("clinicalDetailsComplete", "true");
    setTimeout(() => router.push("/dashboard"), 800);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-[#0b1628]">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="w-9 h-9" />
        <h1 className="text-sm font-semibold text-white">Clinical Details</h1>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
          aria-label="More options"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-4 pb-6 gap-6">
        {/* Page title */}
        <div>
          <h2 className="text-2xl font-bold text-white">Health Profile</h2>
          <p className="text-sm text-slate-400 mt-1">
            Please provide your health profile for clinical assessment.
          </p>
        </div>

        {/* ── VITALS ── */}
        <div className="flex flex-col gap-4">
          <SectionHeader icon="📋" label="VITALS" />

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => update("dob", e.target.value)}
              className={cn(
                "input-field",
                errors.dob && "border-red-500/50 focus:ring-red-500/30"
              )}
            />
            {errors.dob && (
              <p className="text-red-400 text-xs" role="alert">{errors.dob}</p>
            )}
          </div>

          {/* Weight + Height */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Weight (KG)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="72"
                  value={form.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  className={cn(
                    "input-field pr-10",
                    errors.weight && "border-red-500/50"
                  )}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                  kg
                </span>
              </div>
              {errors.weight && (
                <p className="text-red-400 text-xs" role="alert">{errors.weight}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Height (CM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="175"
                  value={form.height}
                  onChange={(e) => update("height", e.target.value)}
                  className={cn(
                    "input-field pr-10",
                    errors.height && "border-red-500/50"
                  )}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                  cm
                </span>
              </div>
              {errors.height && (
                <p className="text-red-400 text-xs" role="alert">{errors.height}</p>
              )}
            </div>
          </div>

          {/* BMI — auto-calculated, read-only */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Body Mass Index (BMI)
              </label>
              {bmiInfo && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                    bmiInfo.cls
                  )}
                >
                  {bmiInfo.text}
                </span>
              )}
            </div>
            <div className="input-field flex items-baseline gap-1.5 select-none cursor-not-allowed opacity-80">
              <span className="text-2xl font-bold text-slate-200">
                {bmi || "—"}
              </span>
              <span className="text-xs text-slate-500">kg/m²</span>
            </div>
          </div>
        </div>

        {/* ── MEDICAL HISTORY ── */}
        <div className="flex flex-col gap-4">
          <SectionHeader icon="🏥" label="MEDICAL HISTORY" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Past Medical History
            </label>
            <textarea
              rows={5}
              placeholder="List any previous surgeries, chronic illnesses, or significant diagnoses."
              value={form.pastMedicalHistory}
              onChange={(e) => update("pastMedicalHistory", e.target.value)}
              className="input-field resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* ── CURRENT MEDICATIONS ── */}
        <div className="flex flex-col gap-4">
          <SectionHeader icon="💊" label="CURRENT MEDICATIONS" />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Current Medications
            </label>
            <textarea
              rows={5}
              placeholder="List medications you are currently taking, including dosage and frequency."
              value={form.currentMedications}
              onChange={(e) => update("currentMedications", e.target.value)}
              className="input-field resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Save & Continue */}
        <div className="flex flex-col gap-3 mt-auto pt-2">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              "w-full min-h-[52px] rounded-xl font-semibold text-sm text-white",
              "flex items-center justify-center gap-2 transition-opacity",
              "bg-gradient-to-r from-blue-600 to-blue-500",
              "shadow-lg shadow-blue-500/25",
              "hover:opacity-90 active:opacity-80 disabled:opacity-60"
            )}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : saved ? (
              "✓ Saved!"
            ) : (
              "Save & Continue"
            )}
          </button>

          <p className="text-[11px] text-center text-slate-600 flex items-center justify-center gap-1.5">
            <Lock size={10} />
            Your data is encrypted and visible only to your clinical team.
          </p>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  icon,
  label,
}: {
  icon: string;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/20 flex items-center justify-center text-sm leading-none">
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}
