"use client";

import { Bell, ChevronRight, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Mock data — replace with real API calls
const patient = {
  name: "Eleanor Thorne",
  age: 42,
  id: "ET-8821",
  bloodType: "A+",
  lastSync: "14 OCT 2023 — 08:42 AM",
};

const metrics = [
  {
    id: "blood-pressure",
    label: "Blood Pressure",
    value: "118/76",
    unit: "mmHg",
    status: "normal" as const,
    icon: "🫀",
    href: "/metrics/blood-pressure",
  },
  {
    id: "blood-sugar",
    label: "Blood Sugar",
    value: "104",
    unit: "mg/dL",
    status: "elevated" as const,
    icon: "🩸",
    href: "/metrics/blood-sugar",
  },
  {
    id: "kidney",
    label: "Kidney Function",
    value: "98",
    unit: "mL/min",
    status: "normal" as const,
    icon: "⚕️",
    href: "/metrics/kidney",
  },
  {
    id: "liver",
    label: "Liver Function",
    value: "24",
    unit: "U/L",
    status: "normal" as const,
    icon: "🧬",
    href: "/metrics/liver",
  },
  {
    id: "hormonal",
    label: "Hormonal",
    value: "—",
    unit: "",
    status: "stable" as const,
    icon: "⚗️",
    href: "/metrics/hormonal",
  },
  {
    id: "lipid",
    label: "Lipid Profile",
    value: "—",
    unit: "",
    status: "normal" as const,
    icon: "💊",
    href: "/metrics/lipid",
  },
];

const trendData = [
  { day: "MON", primary: 65, baseline: 50 },
  { day: "TUE", primary: 80, baseline: 55 },
  { day: "WED", primary: 55, baseline: 60 },
  { day: "THU", primary: 90, baseline: 65 },
  { day: "FRI", primary: 75, baseline: 58 },
  { day: "SAT", primary: 85, baseline: 62 },
  { day: "SUN", primary: 70, baseline: 55 },
];

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-[#0f1e35] to-transparent">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 4L6 10v12l10 6 10-6V10L16 4z"
                  stroke="#60a5fa"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-xs text-blue-400 font-semibold tracking-wider">
              Clinical Luminance
            </span>
          </div>
          <button
            className="relative w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full" />
          </button>
        </div>

        {/* Patient info */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-white">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-sm text-slate-400">Age {patient.age}</span>
            <span className="text-slate-600">·</span>
            <span className="text-sm text-slate-400">ID #{patient.id}</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Blood Type {patient.bloodType}
            </span>
          </div>
        </div>

        {/* Last sync */}
        <div className="mt-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
            Last Synchronized
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-300 mt-0.5">{patient.lastSync}</p>
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
                      <span className="text-2xl font-bold text-white">{m.value}</span>
                      {m.unit && (
                        <span className="text-xs text-slate-500">{m.unit}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500 text-sm">No data</span>
                  )}
                  <p className="text-xs text-slate-500 mt-1">{m.label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Request more tests */}
      <div className="px-4 mt-6">
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/5 transition-colors">
          <Plus size={16} />
          REQUEST MORE TESTS
        </button>
      </div>

      {/* Clinical Observation Trend */}
      <div className="px-4 mt-6 mb-4">
        <div className="card p-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-base font-semibold text-white">
                Clinical Observation Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Longitudinal analysis of primary health metrics
              </p>
            </div>
            <TrendingUp size={18} className="text-blue-400 mt-0.5" />
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs text-slate-400">Primary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-600" />
              <span className="text-xs text-slate-400">Baseline</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} barGap={2}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f1e35",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
                cursor={{ fill: "rgba(59,130,246,0.05)" }}
              />
              <Bar dataKey="baseline" fill="#334155" radius={[3, 3, 0, 0]} />
              <Bar dataKey="primary" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
