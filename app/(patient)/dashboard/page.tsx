"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { useTheme } from "@/lib/theme";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

type MetricStatus = "normal" | "elevated" | "stable" | "high" | "low" | "borderline";

interface LatestBS {
  value: number;
  unit: string;
  status: string;
  recordedAt: string;
}

interface LatestBP {
  systolic: number;
  diastolic: number;
  status: string;
}

interface ProfileData {
  fullName: string;
  gender: string | null;
  patient: {
    id: string;
    dateOfBirth: string | null;
    bloodType: string | null;
    weight: number | null;
    height: number | null;
    pastMedicalHistory: string | null;
    currentMedications: string | null;
  } | null;
}

function calcBMI(weight: number | null, height: number | null): { value: string; label: string; color: string } | null {
  if (!weight || !height) return null;
  const h = height / 100;
  const bmi = weight / (h * h);
  const value = bmi.toFixed(1);
  if (bmi < 18.5) return { value, label: "Underweight", color: "#a78bfa" };
  if (bmi < 25)   return { value, label: "Normal",      color: "#22c55e" };
  if (bmi < 30)   return { value, label: "Overweight",  color: "#f97316" };
  return               { value, label: "Obese",         color: "#ef4444" };
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
}

function bpStatusToBadge(s: string): MetricStatus {
  if (s === "stage2" || s === "crisis") return "high";
  if (s === "stage1" || s === "elevated") return "elevated";
  return "normal";
}

function bsStatusToBadge(s: string): MetricStatus {
  if (s === "high") return "high";
  if (s === "low") return "low";
  if (s === "borderline") return "borderline";
  return "normal";
}

export default function DashboardPage(): React.ReactElement {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [latestBS, setLatestBS] = useState<LatestBS | null>(null);
  const [latestBP, setLatestBP] = useState<LatestBP | null>(null);
  const [trendData, setTrendData] = useState<{ day: string; primary: number; baseline: number }[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    async function fetchAll(): Promise<void> {
      const [profileRes, bsRes, bpRes, trendRes] = await Promise.allSettled([
        fetch("/api/settings/profile").then((r) => r.json()),
        fetch("/api/readings/blood-sugar?limit=1").then((r) => r.json()),
        fetch("/api/readings/blood-pressure?limit=1").then((r) => r.json()),
        fetch("/api/readings/blood-sugar?limit=7").then((r) => r.json()),
      ]);

      if (profileRes.status === "fulfilled") setProfile(profileRes.value.profile ?? null);
      if (bsRes.status === "fulfilled" && bsRes.value.readings?.length) setLatestBS(bsRes.value.readings[0]);
      if (bpRes.status === "fulfilled" && bpRes.value.readings?.length) setLatestBP(bpRes.value.readings[0]);

      if (trendRes.status === "fulfilled" && trendRes.value.readings?.length) {
        const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        const reversed = [...trendRes.value.readings].reverse();
        setTrendData(
          reversed.map((r: LatestBS) => ({
            day: days[new Date(r.recordedAt).getDay()],
            primary: Math.round(r.value),
            baseline: 100,
          }))
        );
      }
    }
    fetchAll();
  }, []);

  const patientName = profile?.fullName ?? "—";
  const age = calcAge(profile?.patient?.dateOfBirth ?? null);
  const bloodType = profile?.patient?.bloodType ?? null;
  const gender = profile?.gender ?? null;
  const mrNo = profile?.patient?.id ? `MR-${profile.patient.id.slice(0, 8).toUpperCase()}` : null;
  const bmi = calcBMI(profile?.patient?.weight ?? null, profile?.patient?.height ?? null);
  const comorbidities = profile?.patient?.pastMedicalHistory ?? null;
  const medications = profile?.patient?.currentMedications ?? null;

  const bsValue = latestBS ? `${Math.round(latestBS.value)}` : "—";
  const bsStatus: MetricStatus = latestBS ? bsStatusToBadge(latestBS.status) : "stable";
  const bpValue = latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : "—";
  const bpStatus: MetricStatus = latestBP ? bpStatusToBadge(latestBP.status) : "stable";

  const metrics = [
    { id: "blood-pressure", label: "Blood Pressure", value: bpValue,  unit: "mmHg",  status: bpStatus,                        icon: "🫀", href: "/metrics/blood-pressure" },
    { id: "blood-sugar",    label: "Blood Sugar",    value: bsValue,  unit: "mg/dL", status: bsStatus,                        icon: "🩸", href: "/metrics/blood-sugar" },
    { id: "kidney",   label: "Kidney Function", value: "—", unit: "", status: "stable" as MetricStatus, icon: "⚕️", href: "/metrics/kidney" },
    { id: "liver",    label: "Liver Function",  value: "—", unit: "", status: "stable" as MetricStatus, icon: "🧬", href: "/metrics/liver" },
    { id: "hormonal", label: "Hormonal",         value: "—", unit: "", status: "stable" as MetricStatus, icon: "⚗️", href: "/metrics/hormonal" },
    { id: "lipid",    label: "Lipid Profile",    value: "—", unit: "", status: "stable" as MetricStatus, icon: "💊", href: "/metrics/lipid" },
  ];

  const chartData =
    trendData.length > 0
      ? trendData
      : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => ({
          day,
          primary: 0,
          baseline: 100,
        }));

  const tooltipStyle = {
    background: isDark ? "#0f1e35" : "#ffffff",
    border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "8px",
    fontSize: "12px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, var(--color-surface), transparent)"
            : "linear-gradient(to bottom, var(--color-surface), transparent)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L6 10v12l10 6 10-6V10L16 4z" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold tracking-wider">
              Clinical Luminance
            </span>
          </div>
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full" />
          </button>
        </div>

        {/* Patient info */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>{patientName}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {age !== null && (
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Age {age}</span>
            )}
            {age !== null && gender && <span style={{ color: "var(--color-text-dim)" }}>·</span>}
            {gender && (
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{gender}</span>
            )}
            {mrNo && (
              <>
                <span style={{ color: "var(--color-text-dim)" }}>·</span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--color-text-dim)" }}>{mrNo}</span>
              </>
            )}
          </div>
          {bloodType && (
            <div className="mt-2">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Blood Type {bloodType}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="px-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <Link key={m.id} href={m.href}>
              <div className="card p-4 hover:border-blue-500/30 transition-all duration-150 active:scale-95">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-lg">{m.icon}</span>
                  <StatusBadge status={m.status} />
                </div>
                <div>
                  {m.value !== "—" ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{m.value}</span>
                      {m.unit && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.unit}</span>}
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>No data</span>
                  )}
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{m.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Clinical Summary — BMI, Comorbidities, Medications */}
      {(bmi || comorbidities || medications) && (
        <div className="px-4 mt-6">
          <div className="rounded-2xl overflow-hidden border border-blue-500/20"
            style={{ background: isDark ? "linear-gradient(135deg, #0f1e35 0%, #152540 100%)" : "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)" }}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-blue-500/10">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Activity size={13} className="text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase">Clinical Summary</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* BMI */}
              {bmi && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--color-text-dim)" }}>Body Mass Index</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold" style={{ color: bmi.color }}>{bmi.value}</span>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>kg/m²</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{
                      color: bmi.color,
                      borderColor: `${bmi.color}40`,
                      backgroundColor: `${bmi.color}15`,
                    }}>{bmi.label}</span>
                  </div>
                  {/* BMI bar */}
                  <div className="mt-2 h-2 rounded-full overflow-hidden flex gap-0.5" style={{ backgroundColor: "var(--color-overlay)" }}>
                    {[
                      { range: [0,18.5], color: "#a78bfa", label: "Under" },
                      { range: [18.5,25], color: "#22c55e", label: "Normal" },
                      { range: [25,30], color: "#f97316", label: "Over" },
                      { range: [30,40], color: "#ef4444", label: "Obese" },
                    ].map(({ range, color }) => {
                      const bmiNum = parseFloat(bmi.value);
                      const isActive = bmiNum >= range[0] && bmiNum < range[1];
                      return (
                        <div key={color} className="flex-1 h-full rounded-full transition-all"
                          style={{ backgroundColor: isActive ? color : `${color}30` }} />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["< 18.5", "18.5–25", "25–30", "> 30"].map((l) => (
                      <span key={l} className="text-[9px]" style={{ color: "var(--color-text-dim)" }}>{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comorbidities */}
              {comorbidities && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "var(--color-text-dim)" }}>Comorbidities / Medical History</p>
                  <div className="flex flex-wrap gap-1.5">
                    {comorbidities.split(/[,\n]+/).map((c) => c.trim()).filter(Boolean).map((condition) => (
                      <span key={condition} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
                          color: isDark ? "#fca5a5" : "#dc2626",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}>
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Medications */}
              {medications && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "var(--color-text-dim)" }}>Current Medications</p>
                  <div className="flex flex-wrap gap-1.5">
                    {medications.split(/[,\n]+/).map((m) => m.trim()).filter(Boolean).map((med) => (
                      <span key={med} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: isDark ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.08)",
                          color: isDark ? "#93c5fd" : "#2563eb",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}>
                        💊 {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request more tests */}
      <div className="px-4 mt-6">
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-blue-500/30 text-blue-500 dark:text-blue-400 text-sm font-medium hover:bg-blue-500/5 transition-colors">
          <Plus size={16} />
          REQUEST MORE TESTS
        </button>
      </div>

      {/* Clinical Observation Trend */}
      <div className="px-4 mt-6 mb-4">
        <div className="card p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                Clinical Observation Trend
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                Blood sugar — last 7 readings
              </p>
            </div>
            <TrendingUp size={18} className="text-blue-500 dark:text-blue-400 mt-0.5" />
          </div>

          <div className="flex gap-4 mb-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Blood Sugar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: isDark ? "#334155" : "#cbd5e1" }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Target (100)</span>
            </div>
          </div>

          {mounted && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(59,130,246,0.05)" }} />
                <Bar dataKey="baseline" fill={isDark ? "#334155" : "#cbd5e1"} radius={[3, 3, 0, 0]} />
                <Bar dataKey="primary"  fill="#3b82f6"                        radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
