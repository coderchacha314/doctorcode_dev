import type { ReadingContext } from "@prisma/client";

export type MetricStatus = "normal" | "low" | "borderline" | "elevated" | "high";

export type BloodSugarStatus = "normal" | "borderline" | "high" | "low";
export type BpStatus = "normal" | "elevated" | "stage1" | "stage2" | "crisis";

/**
 * Compute blood sugar status.
 * Values in mg/dL.
 */
export function getBloodSugarStatus(
  value: number,
  unit: "MMOL" | "MGDL",
  context: ReadingContext
): BloodSugarStatus {
  // Normalise to mmol/L for range checks
  const mmol = unit === "MGDL" ? value / 18.0 : value;

  if (context === "FASTING" || context === "BEFORE_MEAL") {
    if (mmol < 3.9) return "low";
    if (mmol <= 5.5) return "normal";
    if (mmol <= 6.9) return "borderline";
    return "high";
  }

  // POST_MEAL / RANDOM / BEDTIME — 2-hour post-meal ranges
  if (mmol < 3.9) return "low";
  if (mmol < 7.8) return "normal";
  if (mmol < 11.1) return "borderline";
  return "high";
}

/**
 * Compute blood pressure status from systolic/diastolic (mmHg).
 */
export function getBpStatus(systolic: number, diastolic: number): BpStatus {
  if (systolic > 180 || diastolic > 120) return "crisis";
  if (systolic >= 140 || diastolic >= 90) return "stage2";
  if (systolic >= 130 || diastolic >= 80) return "stage1";
  if (systolic >= 120 && diastolic < 80) return "elevated";
  return "normal";
}

/** Kidney — creatinine mg/dL */
export function getKidneyStatus(creatinine: number | null): MetricStatus {
  if (creatinine == null) return "normal";
  if (creatinine < 0.5) return "low";
  if (creatinine <= 1.2) return "normal";
  if (creatinine <= 2.0) return "elevated";
  return "high";
}

/** Liver — ALT U/L */
export function getLiverStatus(alt: number | null): MetricStatus {
  if (alt == null) return "normal";
  if (alt <= 56) return "normal";
  if (alt <= 100) return "elevated";
  return "high";
}

/** Hormonal — TSH mIU/L */
export function getHormonalStatus(tsh: number | null): MetricStatus {
  if (tsh == null) return "normal";
  if (tsh < 0.4) return "low";
  if (tsh <= 4.0) return "normal";
  if (tsh <= 10.0) return "elevated";
  return "high";
}

/** Lipid — LDL mg/dL */
export function getLipidStatus(ldl: number | null): MetricStatus {
  if (ldl == null) return "normal";
  if (ldl < 100) return "normal";
  if (ldl < 130) return "borderline";
  if (ldl < 160) return "elevated";
  return "high";
}
