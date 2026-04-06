"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import StatusBadge from "@/components/ui/StatusBadge";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Range = "7D" | "30D";
type ReadingStatus = "normal" | "elevated" | "stable" | "high" | "low" | "borderline";

interface BSReading {
  id: string;
  value: number;
  unit: string;
  context: string;
  notes: string | null;
  recordedAt: string;
  status: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  FASTING: "Fasting",
  POST_MEAL: "Post Meal",
  BEFORE_MEAL: "Before Meal",
  RANDOM: "Random",
  BEDTIME: "Bedtime",
};

function formatDate(iso: string): { date: string; month: string; time: string } {
  const d = new Date(iso);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return {
    date: d.getDate().toString().padStart(2, "0"),
    month: months[d.getMonth()],
    time: `${h12.toString().padStart(2, "0")}:${m} ${ampm}`,
  };
}

function toReadingStatus(s: string): ReadingStatus {
  if (s === "high") return "high";
  if (s === "low") return "low";
  if (s === "borderline") return "borderline";
  return "normal";
}

export default function BloodSugarPage(): React.ReactElement {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [range, setRange] = useState<Range>("7D");
  const [formValue, setFormValue] = useState("");
  const [formContext, setFormContext] = useState("FASTING");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [readings, setReadings] = useState<BSReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchReadings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - (range === "7D" ? 7 : 30));
      const res = await fetch(`/api/readings/blood-sugar?limit=100&from=${from.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setReadings(data.readings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [range, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const tooltipStyle = {
    background: isDark ? "#0f1e35" : "#ffffff",
    border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "8px", fontSize: "12px",
    color: isDark ? "#f1f5f9" : "#0f172a",
  };

  const latest = readings[0] ?? null;
  const avg = readings.length
    ? (readings.reduce((sum, r) => sum + r.value, 0) / readings.length).toFixed(1)
    : "—";

  const chartData = [...readings].reverse().map((r) => {
    const d = new Date(r.recordedAt);
    const day =
      range === "7D"
        ? ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()]
        : `${d.getDate()}/${d.getMonth() + 1}`;
    return { day, value: Math.round(r.value) };
  });

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaveError("");
    if (!formValue) { setSaveError("Value is required."); return; }
    if (!formDate)  { setSaveError("Date is required.");  return; }
    if (!formTime)  { setSaveError("Time is required.");  return; }
    setSaving(true);
    try {
      const res = await fetch("/api/readings/blood-sugar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(formValue),
          unit: "MGDL",
          context: formContext,
          recordedAt: new Date(`${formDate}T${formTime}`).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save reading");
        return;
      }
      setFormValue(""); setFormDate(""); setFormTime("");
      setRefreshKey((k) => k + 1);
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }} aria-label="Back">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-medium tracking-wider" style={{ color: "var(--color-text-muted)" }}>HEALTH METRICS</h1>
          <div className="w-9 h-9" />
        </div>

        <div>
          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold tracking-widest uppercase">Detailed Analysis</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Blood Sugar</h2>
            {latest && <StatusBadge status={toReadingStatus(latest.status)} />}
          </div>
        </div>

        <div className="mt-4 flex items-end gap-8">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Latest Reading</p>
            <div className="flex items-baseline gap-1">
              {latest ? (
                <>
                  <span className="text-5xl font-bold" style={{ color: "var(--color-text)" }}>{Math.round(latest.value)}</span>
                  <span className="text-base" style={{ color: "var(--color-text-muted)" }}>mg/dL</span>
                </>
              ) : (
                <span className="text-2xl" style={{ color: "var(--color-text-muted)" }}>No data</span>
              )}
            </div>
          </div>
          <div className="flex gap-6 pb-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Avg {range}</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>{avg}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Target</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>80–110</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log New Entry */}
      <div className="px-4 mt-4">
        <details className="card overflow-hidden" open>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none">
            <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">⊕</span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>Log New Entry</span>
          </summary>
          <form onSubmit={handleSave} className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Value (mg/dL)</label>
              <input type="number" inputMode="decimal" placeholder="000" value={formValue}
                onChange={(e) => setFormValue(e.target.value)} className="input-field text-2xl font-bold" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Context</label>
              <select value={formContext} onChange={(e) => setFormContext(e.target.value)} className="input-field">
                {Object.entries(CONTEXT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Time</label>
                <input type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} className="input-field" />
              </div>
            </div>
            {saveError && <p className="text-red-500 text-xs" role="alert">{saveError}</p>}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving ? (<><Loader2 size={14} className="animate-spin mr-2" />Saving…</>) : "Save Entry →"}
            </button>
          </form>
        </details>
      </div>

      {/* History chart */}
      <div className="px-4 mt-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>History</h3>
            <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--color-bg)" }}>
              {(["7D", "30D"] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    range === r ? "bg-blue-600 text-white" : "")}
                  style={range !== r ? { color: "var(--color-text-muted)" } : {}}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-blue-500" />
            </div>
          ) : chartData.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>
              No readings in this period
            </p>
          ) : mounted ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[60, 160]} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={80}  stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
                <ReferenceLine y={110} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#60a5fa" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      {/* History entries */}
      <div className="px-4 mt-4 flex flex-col gap-2 pb-4">
        {readings.length === 0 && !loading ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No readings yet. Log your first entry above.
            </p>
          </div>
        ) : (
          readings.slice(0, 10).map((entry) => {
            const { date, month, time } = formatDate(entry.recordedAt);
            return (
              <div key={entry.id} className="card px-4 py-3 flex items-center gap-4">
                <div className="flex flex-col items-center min-w-[36px]">
                  <span className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>{month}</span>
                  <span className="text-lg font-bold" style={{ color: "var(--color-text-2)" }}>{date}</span>
                </div>
                <div className="w-px h-8" style={{ backgroundColor: "var(--color-divider)" }} />
                <div className="flex-1">
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{time}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {CONTEXT_LABELS[entry.context] ?? entry.context}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{Math.round(entry.value)}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>mg/dL</span>
                  </div>
                  <StatusBadge status={toReadingStatus(entry.status)} />
                </div>
                <ChevronRight size={14} style={{ color: "var(--color-text-dim)" }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
