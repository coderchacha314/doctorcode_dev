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

interface LiverReading {
  id: string;
  alt: number | null;
  ast: number | null;
  alp: number | null;
  bilirubin: number | null;
  albumin: number | null;
  notes: string | null;
  recordedAt: string;
  status: string;
}

function statusToBadge(s: string): ReadingStatus {
  if (s === "high") return "high";
  if (s === "elevated") return "elevated";
  return "normal";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const h = d.getHours(), m = d.getMinutes().toString().padStart(2,"0");
  const ampm = h >= 12 ? "PM" : "AM";
  return { date: d.getDate().toString().padStart(2,"0"), month: months[d.getMonth()], time: `${(h%12||12).toString().padStart(2,"0")}:${m} ${ampm}` };
}

export default function LiverPage(): React.ReactElement {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [range, setRange] = useState<Range>("7D");
  const [readings, setReadings] = useState<LiverReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formAlt, setFormAlt] = useState("");
  const [formAst, setFormAst] = useState("");
  const [formAlp, setFormAlp] = useState("");
  const [formBilirubin, setFormBilirubin] = useState("");
  const [formAlbumin, setFormAlbumin] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const fetchReadings = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - (range === "7D" ? 7 : 30));
      const res = await fetch(`/api/readings/liver?limit=100&from=${from.toISOString()}`);
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
    return { day, alt: r.alt ?? 0, ast: r.ast ?? 0 };
  });

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaveError("");
    if (!formAlt && !formAst && !formAlp && !formBilirubin && !formAlbumin) { setSaveError("Enter at least one value."); return; }
    if (!formDate || !formTime) { setSaveError("Date and time are required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/readings/liver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alt: formAlt ? parseFloat(formAlt) : undefined,
          ast: formAst ? parseFloat(formAst) : undefined,
          alp: formAlp ? parseFloat(formAlp) : undefined,
          bilirubin: formBilirubin ? parseFloat(formBilirubin) : undefined,
          albumin: formAlbumin ? parseFloat(formAlbumin) : undefined,
          recordedAt: new Date(`${formDate}T${formTime}`).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? "Failed"); return; }
      setFormAlt(""); setFormAst(""); setFormAlp(""); setFormBilirubin(""); setFormAlbumin(""); setFormDate(""); setFormTime("");
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
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Liver Function</h2>
            {latest && <StatusBadge status={statusToBadge(latest.status)} />}
          </div>
        </div>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>ALT (SGPT)</p>
            {latest?.alt != null ? (
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: "var(--color-text)" }}>{Math.round(latest.alt)}</span>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>U/L</span>
              </div>
            ) : <span className="text-xl" style={{ color: "var(--color-text-muted)" }}>—</span>}
          </div>
          {latest?.ast != null && <div>
            <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>AST (SGOT)</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ color: "var(--color-text)" }}>{Math.round(latest.ast)}</span>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>U/L</span>
            </div>
          </div>}
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
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>ALT/SGPT (U/L)</label>
                <input type="number" inputMode="decimal" placeholder="35" value={formAlt} onChange={(e) => setFormAlt(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>AST/SGOT (U/L)</label>
                <input type="number" inputMode="decimal" placeholder="30" value={formAst} onChange={(e) => setFormAst(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>ALP (U/L)</label>
                <input type="number" inputMode="decimal" placeholder="80" value={formAlp} onChange={(e) => setFormAlp(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Bilirubin (mg/dL)</label>
                <input type="number" inputMode="decimal" step="0.1" placeholder="0.8" value={formBilirubin} onChange={(e) => setFormBilirubin(e.target.value)} className="input-field" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Albumin (g/dL)</label>
                <input type="number" inputMode="decimal" step="0.1" placeholder="4.0" value={formAlbumin} onChange={(e) => setFormAlbumin(e.target.value)} className="input-field" />
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
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-2)" }}>ALT / AST Trend</h3>
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
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine y={56} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="alt" name="ALT" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="ast" name="AST" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
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
                  {[entry.alp != null && `ALP: ${Math.round(entry.alp)}`, entry.bilirubin != null && `Bili: ${entry.bilirubin}`, entry.albumin != null && `Alb: ${entry.albumin}`].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base font-bold" style={{ color: "var(--color-text)" }}>{entry.alt != null ? Math.round(entry.alt) : "—"}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>/</span>
                  <span className="text-base font-bold" style={{ color: "var(--color-text)" }}>{entry.ast != null ? Math.round(entry.ast) : "—"}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>U/L</span>
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
