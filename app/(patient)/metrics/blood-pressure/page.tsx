"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import StatusBadge from "@/components/ui/StatusBadge";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Range = "7D" | "30D";
type ReadingStatus = "normal" | "elevated" | "stable" | "high" | "low" | "borderline";

interface BPReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  arm: string;
  notes: string | null;
  recordedAt: string;
  status: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  return { date: d.getDate().toString().padStart(2,"0"), month: months[d.getMonth()], time: `${(h%12||12).toString().padStart(2,"0")}:${m} ${ampm}` };
}

function bpStatusToBadge(s: string): ReadingStatus {
  if (s === "stage2" || s === "crisis") return "high";
  if (s === "stage1" || s === "elevated") return "elevated";
  return "normal";
}

export default function BloodPressurePage(): React.ReactElement {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [range, setRange] = useState<Range>("7D");
  const [readings, setReadings] = useState<BPReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [arm, setArm] = useState("LEFT");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const fetchReadings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - (range === "7D" ? 7 : 30));
      const res = await fetch(`/api/readings/blood-pressure?limit=100&from=${from.toISOString()}`);
      if (res.ok) { const data = await res.json(); setReadings(data.readings ?? []); }
    } finally { setLoading(false); }
  }, [range, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  const tooltipStyle = {
    background: isDark ? "#0f1e35" : "#ffffff",
    border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(0,0,0,0.1)",
    borderRadius: "8px", fontSize: "12px", color: isDark ? "#f1f5f9" : "#0f172a",
  };

  const latest = readings[0] ?? null;
  const chartData = [...readings].reverse().map((r) => {
    const d = new Date(r.recordedAt);
    const day = range === "7D"
      ? ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()]
      : `${d.getDate()}/${d.getMonth()+1}`;
    return { day, systolic: r.systolic, diastolic: r.diastolic };
  });

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaveError("");
    if (!systolic || !diastolic) { setSaveError("Systolic and diastolic are required."); return; }
    if (!formDate) { setSaveError("Date is required."); return; }
    if (!formTime) { setSaveError("Time is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/readings/blood-pressure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
          pulse: pulse ? parseInt(pulse) : undefined,
          arm,
          recordedAt: new Date(`${formDate}T${formTime}`).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? "Failed"); return; }
      setSystolic(""); setDiastolic(""); setPulse(""); setFormDate(""); setFormTime("");
      setRefreshKey((k) => k + 1);
    } catch { setSaveError("Network error."); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-12 pb-4" style={{ backgroundColor: "var(--color-surface)" }}>
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-medium tracking-wider" style={{ color: "var(--color-text-muted)" }}>HEALTH METRICS</h1>
          <div className="w-9 h-9" />
        </div>
        <div>
          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold tracking-widest uppercase">Detailed Analysis</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Blood Pressure</h2>
            {latest && <StatusBadge status={bpStatusToBadge(latest.status)} />}
          </div>
        </div>
        <div className="mt-4 flex items-end gap-8">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Latest Reading</p>
            {latest ? (
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold" style={{ color: "var(--color-text)" }}>{latest.systolic}/{latest.diastolic}</span>
                <span className="text-base" style={{ color: "var(--color-text-muted)" }}>mmHg</span>
              </div>
            ) : <span className="text-2xl" style={{ color: "var(--color-text-muted)" }}>No data</span>}
          </div>
          <div className="flex gap-6 pb-1">
            <div><p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Target</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>&lt;120/80</p></div>
            {latest?.pulse && <div><p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>Pulse</p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>{latest.pulse} bpm</p></div>}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Systolic (mmHg)</label>
                <input type="number" inputMode="numeric" placeholder="120" value={systolic} onChange={(e) => setSystolic(e.target.value)} className="input-field text-xl font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Diastolic (mmHg)</label>
                <input type="number" inputMode="numeric" placeholder="80" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} className="input-field text-xl font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Pulse (bpm)</label>
                <input type="number" inputMode="numeric" placeholder="72" value={pulse} onChange={(e) => setPulse(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Arm</label>
                <select value={arm} onChange={(e) => setArm(e.target.value)} className="input-field">
                  <option value="LEFT">Left</option>
                  <option value="RIGHT">Right</option>
                </select>
              </div>
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
              {saving ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : "Save Entry →"}
            </button>
          </form>
        </details>
      </div>

      {/* Chart */}
      <div className="px-4 mt-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>History</h3>
            <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--color-bg)" }}>
              {(["7D","30D"] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", range === r ? "bg-blue-600 text-white" : "")} style={range !== r ? { color: "var(--color-text-muted)" } : {}}>{r}</button>
              ))}
            </div>
          </div>
          {loading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          : chartData.length === 0 ? <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>No readings in this period</p>
          : mounted ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[50, 180]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-text-muted)" }} />
                <ReferenceLine y={120} stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" />
                <ReferenceLine y={80}  stroke="rgba(34,197,94,0.3)"  strokeDasharray="4 4" />
                <Line type="monotone" dataKey="systolic"  stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      {/* History list */}
      <div className="px-4 mt-4 flex flex-col gap-2 pb-4">
        {readings.length === 0 && !loading ? (
          <div className="card p-8 text-center"><p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No readings yet.</p></div>
        ) : readings.slice(0, 10).map((entry) => {
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
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{entry.arm === "LEFT" ? "Left Arm" : "Right Arm"}{entry.pulse ? ` · ${entry.pulse} bpm` : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{entry.systolic}/{entry.diastolic}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>mmHg</span>
                </div>
                <StatusBadge status={bpStatusToBadge(entry.status)} />
              </div>
              <ChevronRight size={14} style={{ color: "var(--color-text-dim)" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
