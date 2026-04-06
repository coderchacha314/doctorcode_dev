"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import StatusBadge from "@/components/ui/StatusBadge";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Range = "7D" | "30D";
type ReadingStatus = "normal" | "elevated" | "stable" | "high" | "low" | "borderline";

interface LipidReading {
  id: string;
  totalCholesterol: number | null;
  ldl: number | null;
  hdl: number | null;
  triglycerides: number | null;
  vldl: number | null;
  notes: string | null;
  recordedAt: string;
  status: string;
}

function statusToBadge(s: string): ReadingStatus {
  if (s === "high") return "high";
  if (s === "elevated") return "elevated";
  if (s === "borderline") return "borderline";
  return "normal";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  return { date: d.getDate().toString().padStart(2,"0"), month: months[d.getMonth()], time: `${(h%12||12).toString().padStart(2,"0")}:${m} ${ampm}` };
}

export default function LipidPage(): React.ReactElement {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [range, setRange] = useState<Range>("7D");
  const [readings, setReadings] = useState<LipidReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formLdl, setFormLdl] = useState("");
  const [formHdl, setFormHdl] = useState("");
  const [formTrig, setFormTrig] = useState("");
  const [formVldl, setFormVldl] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const fetchReadings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - (range === "7D" ? 7 : 30));
      const res = await fetch(`/api/readings/lipid?limit=100&from=${from.toISOString()}`);
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
    const day = range === "7D" ? ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`;
    return { day, LDL: r.ldl ?? 0, HDL: r.hdl ?? 0, TG: r.triglycerides ?? 0 };
  });

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaveError("");
    if (!formTotal && !formLdl && !formHdl && !formTrig) { setSaveError("Enter at least one value."); return; }
    if (!formDate || !formTime) { setSaveError("Date and time are required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/readings/lipid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalCholesterol: formTotal ? parseFloat(formTotal) : undefined,
          ldl: formLdl ? parseFloat(formLdl) : undefined,
          hdl: formHdl ? parseFloat(formHdl) : undefined,
          triglycerides: formTrig ? parseFloat(formTrig) : undefined,
          vldl: formVldl ? parseFloat(formVldl) : undefined,
          recordedAt: new Date(`${formDate}T${formTime}`).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? "Failed"); return; }
      setFormTotal(""); setFormLdl(""); setFormHdl(""); setFormTrig(""); setFormVldl(""); setFormDate(""); setFormTime("");
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
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Lipid Profile</h2>
            {latest && <StatusBadge status={statusToBadge(latest.status)} />}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            { label: "Total Cholesterol", val: latest?.totalCholesterol, unit: "mg/dL" },
            { label: "LDL",               val: latest?.ldl,              unit: "mg/dL" },
            { label: "HDL",               val: latest?.hdl,              unit: "mg/dL" },
            { label: "Triglycerides",     val: latest?.triglycerides,    unit: "mg/dL" },
          ].map(({ label, val, unit }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>{label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{val != null ? Math.round(val) : "—"}</span>
                {val != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        <details className="card overflow-hidden" open>
          <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none">
            <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">⊕</span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>Log New Entry</span>
          </summary>
          <form onSubmit={handleSave} className="px-4 pb-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Cholesterol</label>
                <input type="number" inputMode="decimal" placeholder="200" value={formTotal} onChange={(e) => setFormTotal(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>LDL (mg/dL)</label>
                <input type="number" inputMode="decimal" placeholder="100" value={formLdl} onChange={(e) => setFormLdl(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>HDL (mg/dL)</label>
                <input type="number" inputMode="decimal" placeholder="60" value={formHdl} onChange={(e) => setFormHdl(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Triglycerides</label>
                <input type="number" inputMode="decimal" placeholder="150" value={formTrig} onChange={(e) => setFormTrig(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>VLDL (mg/dL)</label>
                <input type="number" inputMode="decimal" placeholder="30" value={formVldl} onChange={(e) => setFormVldl(e.target.value)} className="input-field" />
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

      <div className="px-4 mt-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>LDL / HDL / TG</h3>
            <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: "var(--color-bg)" }}>
              {(["7D","30D"] as Range[]).map((r) => (
                <button key={r} onClick={() => setRange(r)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors", range === r ? "bg-blue-600 text-white" : "")} style={range !== r ? { color: "var(--color-text-muted)" } : {}}>{r}</button>
              ))}
            </div>
          </div>
          {loading ? <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
          : chartData.length === 0 ? <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>No readings in this period</p>
          : mounted ? (
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={chartData} barGap={2}>
                <XAxis dataKey="day" tick={{ fill: "var(--color-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={100} stroke="rgba(59,130,246,0.3)" strokeDasharray="4 4" />
                <Bar dataKey="LDL" fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="HDL" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="TG"  fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-2 pb-4">
        {readings.length === 0 && !loading ? (
          <div className="card p-8 text-center"><p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No readings yet. Log your first entry above.</p></div>
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
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {[entry.ldl != null && `LDL: ${Math.round(entry.ldl)}`, entry.hdl != null && `HDL: ${Math.round(entry.hdl)}`, entry.triglycerides != null && `TG: ${Math.round(entry.triglycerides)}`].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{entry.totalCholesterol != null ? Math.round(entry.totalCholesterol) : "—"}</span>
                  {entry.totalCholesterol != null && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>mg/dL</span>}
                </div>
                <StatusBadge status={statusToBadge(entry.status)} />
              </div>
              <ChevronRight size={14} style={{ color: "var(--color-text-dim)" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
