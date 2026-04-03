"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

type Range = "7D" | "30D";

// Mock data — replace with real API
const latestReading = {
  value: 94,
  unit: "mg/dL",
  avg: 98.2,
  target: "80–110",
  status: "stable" as const,
};

const chartData7D = [
  { day: "MON", value: 88 },
  { day: "TUE", value: 102 },
  { day: "WED", value: 94 },
  { day: "THU", value: 132 },
  { day: "FRI", value: 96 },
  { day: "SAT", value: 104 },
  { day: "SUN", value: 94 },
];

const chartData30D = [
  { day: "W1", value: 96 },
  { day: "W2", value: 108 },
  { day: "W3", value: 91 },
  { day: "W4", value: 94 },
];

const historyEntries = [
  {
    id: "1",
    date: "24",
    month: "OCT",
    time: "08:45 AM",
    context: "After Breakfast",
    value: 94,
    unit: "mg/dL",
    status: "normal" as const,
  },
  {
    id: "2",
    date: "24",
    month: "OCT",
    time: "10:15 PM",
    context: "Post Dinner",
    value: 132,
    unit: "mg/dL",
    status: "elevated" as const,
  },
  {
    id: "3",
    date: "23",
    month: "OCT",
    time: "07:20 AM",
    context: "Fasting",
    value: 88,
    unit: "mg/dL",
    status: "normal" as const,
  },
];

export default function BloodSugarPage(): React.ReactElement {
  const [range, setRange] = useState<Range>("7D");
  const [formValue, setFormValue] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const chartData = range === "7D" ? chartData7D : chartData30D;

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaveError("");
    if (!formValue) { setSaveError("Value is required."); return; }
    if (!formDate) { setSaveError("Date is required."); return; }
    if (!formTime) { setSaveError("Time is required."); return; }
    setSaving(true);
    // TODO: POST /api/readings/blood-sugar
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setFormValue("");
    setFormDate("");
    setFormTime("");
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-[#0f1e35]">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-medium text-slate-400 tracking-wider">
            HEALTH METRICS
          </h1>
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">ET</span>
          </div>
        </div>

        {/* Latest reading */}
        <div>
          <p className="text-[10px] text-blue-400 font-semibold tracking-widest uppercase">
            Detailed Analysis
          </p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold text-white">Blood Sugar</h2>
            <StatusBadge status={latestReading.status} />
          </div>
        </div>

        <div className="mt-4 flex items-end gap-8">
          <div>
            <p className="text-xs text-slate-500 mb-1">Latest Reading</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">
                {latestReading.value}
              </span>
              <span className="text-base text-slate-400">{latestReading.unit}</span>
            </div>
          </div>
          <div className="flex gap-6 pb-1">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg 7D</p>
              <p className="text-sm font-semibold text-slate-300">{latestReading.avg}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Target</p>
              <p className="text-sm font-semibold text-slate-300">{latestReading.target}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log New Entry */}
      <div className="px-4 mt-4">
        <details className="card overflow-hidden" open>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none">
            <span className="text-xs text-blue-400 font-semibold tracking-wider">⊕</span>
            <span className="text-sm font-semibold text-slate-200">Log New Entry</span>
          </summary>
          <form onSubmit={handleSave} className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500 uppercase tracking-wider">
                Value (mg/dL)
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="000"
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="input-field text-2xl font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider">
                  Time
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            {saveError && (
              <p className="text-red-400 text-xs" role="alert">{saveError}</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Saving…
                </>
              ) : (
                "Save Entry →"
              )}
            </button>
          </form>
        </details>
      </div>

      {/* History chart */}
      <div className="px-4 mt-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">History</h3>
            <div className="flex gap-1 bg-[#0b1628] rounded-lg p-1">
              {(["7D", "30D"] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    range === r
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[60, 160]} />
              <Tooltip
                contentStyle={{
                  background: "#0f1e35",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#f1f5f9",
                }}
              />
              <ReferenceLine y={80} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
              <ReferenceLine y={110} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#60a5fa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History entries */}
      <div className="px-4 mt-4 flex flex-col gap-2">
        {historyEntries.map((entry) => (
          <Link key={entry.id} href={`/readings/${entry.id}`}>
            <div className="card px-4 py-3 flex items-center gap-4 hover:border-blue-500/30 active:scale-[0.98] transition-all">
              {/* Date */}
              <div className="flex flex-col items-center min-w-[36px]">
                <span className="text-[10px] text-slate-500 uppercase">{entry.month}</span>
                <span className="text-lg font-bold text-slate-200">{entry.date}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              {/* Details */}
              <div className="flex-1">
                <p className="text-xs text-slate-500">{entry.time}</p>
                <p className="text-xs text-slate-400 mt-0.5">{entry.context}</p>
              </div>
              {/* Value */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-white">{entry.value}</span>
                  <span className="text-xs text-slate-500">{entry.unit}</span>
                </div>
                <StatusBadge status={entry.status} />
              </div>
              <ChevronRight size={14} className="text-slate-600" />
            </div>
          </Link>
        ))}

        <button className="w-full py-3 text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">
          View All Records
        </button>
      </div>
    </div>
  );
}
