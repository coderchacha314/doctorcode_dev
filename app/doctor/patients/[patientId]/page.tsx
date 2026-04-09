"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, X, Loader2, FileText, Pill, FlaskConical,
  Activity, Calendar, Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface PatientDetail {
  id: string;
  mrNumber: string;
  fullName: string;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  weight: number | null;
  height: number | null;
  bloodType: string | null;
  pastMedicalHistory: string | null;
  currentMedications: string | null;
  bloodSugarReadings: Array<{ id: string; value: number; unit: string; context: string; recordedAt: string }>;
  bpReadings: Array<{ id: string; systolic: number; diastolic: number; recordedAt: string }>;
  prescriptions: Prescription[];
  medicalNotes: MedicalNote[];
  orderedTests: OrderedTest[];
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  notes: string | null;
  issuedAt: string;
}

interface MedicalNote {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

interface OrderedTest {
  id: string;
  testName: string;
  category: string | null;
  status: string;
  result: string | null;
  orderedAt: string;
}

type Tab = "overview" | "prescriptions" | "notes" | "tests";

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const NOTE_TYPES = ["PROGRESS", "DIAGNOSIS", "TREATMENT", "FOLLOW_UP", "REFERRAL"] as const;
const NOTE_LABELS: Record<string, string> = {
  PROGRESS: "Progress Note", DIAGNOSIS: "Diagnosis", TREATMENT: "Treatment Plan",
  FOLLOW_UP: "Follow-Up", REFERRAL: "Referral",
};

const TEST_CATEGORIES = ["Blood", "Urine", "Imaging", "ECG", "Biopsy", "Culture", "Other"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  IN_PROGRESS: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/20",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PatientDetailPage({
  params,
}: {
  params: { patientId: string };
}): React.ReactElement {
  const { patientId } = params;
  const router = useRouter();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  // Prescription form state
  const [rxOpen, setRxOpen] = useState(false);
  const [rxData, setRxData] = useState({ medication: "", dosage: "", frequency: "", duration: "", notes: "" });
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");

  // Note form state
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteData, setNoteData] = useState({ title: "", content: "", type: "PROGRESS" });
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState("");

  // Test form state
  const [testOpen, setTestOpen] = useState(false);
  const [testData, setTestData] = useState({ testName: "", category: "" });
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");

  useEffect(() => {
    async function load(): Promise<void> {
      const res = await fetch(`/api/doctor/patients/${patientId}`);
      if (res.status === 401) { router.push("/doctor/login"); return; }
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
      }
      setLoading(false);
    }
    load();
  }, [patientId, router]);

  // ── Add Prescription ──────────────────────────────────────────────────────
  async function submitRx(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setRxError("");
    if (!rxData.medication || !rxData.dosage || !rxData.frequency) {
      setRxError("Medication, dosage and frequency are required.");
      return;
    }
    setRxLoading(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rxData),
      });
      const data = await res.json();
      if (!res.ok) { setRxError(data.error ?? "Failed"); return; }
      setPatient((p) => p ? { ...p, prescriptions: [data.prescription, ...p.prescriptions] } : p);
      setRxOpen(false);
      setRxData({ medication: "", dosage: "", frequency: "", duration: "", notes: "" });
    } catch { setRxError("Network error"); } finally { setRxLoading(false); }
  }

  // ── Add Note ─────────────────────────────────────────────────────────────
  async function submitNote(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setNoteError("");
    if (!noteData.title || !noteData.content) {
      setNoteError("Title and content are required.");
      return;
    }
    setNoteLoading(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
      const data = await res.json();
      if (!res.ok) { setNoteError(data.error ?? "Failed"); return; }
      setPatient((p) => p ? { ...p, medicalNotes: [data.note, ...p.medicalNotes] } : p);
      setNoteOpen(false);
      setNoteData({ title: "", content: "", type: "PROGRESS" });
    } catch { setNoteError("Network error"); } finally { setNoteLoading(false); }
  }

  // ── Order Test ───────────────────────────────────────────────────────────
  async function submitTest(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setTestError("");
    if (!testData.testName) { setTestError("Test name is required."); return; }
    setTestLoading(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });
      const data = await res.json();
      if (!res.ok) { setTestError(data.error ?? "Failed"); return; }
      setPatient((p) => p ? { ...p, orderedTests: [data.test, ...p.orderedTests] } : p);
      setTestOpen(false);
      setTestData({ testName: "", category: "" });
    } catch { setTestError("Network error"); } finally { setTestLoading(false); }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p style={{ color: "var(--color-text-muted)" }}>Patient not found.</p>
        <Link href="/doctor/dashboard" className="text-emerald-500">Back to Dashboard</Link>
      </div>
    );
  }

  const age = calcAge(patient.dateOfBirth);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4 border-b"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/doctor/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>Patient Detail</span>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
          >
            {patient.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{patient.fullName}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs font-mono font-semibold" style={{ color: "var(--color-text-dim)" }}>
                {patient.mrNumber}
              </span>
              {age !== null && <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>· {age}y</span>}
              {patient.gender && <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>· {patient.gender}</span>}
              {patient.bloodType && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {patient.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {(["overview", "prescriptions", "notes", "tests"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-colors",
                tab === t
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 dark:text-gray-400"
              )}
              style={tab !== t ? { backgroundColor: "var(--color-overlay)" } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-auto">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* Clinical details */}
            <div className="card p-4 flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>Clinical Details</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Weight", value: patient.weight ? `${patient.weight} kg` : "—" },
                  { label: "Height", value: patient.height ? `${patient.height} cm` : "—" },
                  { label: "Blood Type", value: patient.bloodType ?? "—" },
                  { label: "DOB", value: patient.dateOfBirth ? fmtDate(patient.dateOfBirth) : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-dim)" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{value}</p>
                  </div>
                ))}
              </div>
              {patient.pastMedicalHistory && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Medical History</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{patient.pastMedicalHistory}</p>
                </div>
              )}
              {patient.currentMedications && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>Current Medications</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{patient.currentMedications}</p>
                </div>
              )}
            </div>

            {/* Latest Blood Sugar */}
            {patient.bloodSugarReadings.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets size={14} className="text-rose-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Blood Sugar</p>
                </div>
                <div className="flex flex-col gap-2">
                  {patient.bloodSugarReadings.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold" style={{ color: "var(--color-text)" }}>{Math.round(r.value)}</span>
                        <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>{r.unit}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-dim)" }}>{r.context}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>{fmtDate(r.recordedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Blood Pressure */}
            {patient.bpReadings.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-blue-500" />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Blood Pressure</p>
                </div>
                <div className="flex flex-col gap-2">
                  {patient.bpReadings.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: "var(--color-text)" }}>{r.systolic}/{r.diastolic} <span className="text-xs font-normal" style={{ color: "var(--color-text-dim)" }}>mmHg</span></span>
                      <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>{fmtDate(r.recordedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {patient.bloodSugarReadings.length === 0 && patient.bpReadings.length === 0 && (
              <p className="text-center text-sm py-6" style={{ color: "var(--color-text-dim)" }}>No readings recorded yet.</p>
            )}
          </div>
        )}

        {/* ── PRESCRIPTIONS ── */}
        {tab === "prescriptions" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRxOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-500 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/5 transition-colors"
            >
              <Plus size={16} /> Add Prescription
            </button>

            {/* Add Prescription Form */}
            {rxOpen && (
              <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>New Prescription</p>
                  <button onClick={() => setRxOpen(false)} style={{ color: "var(--color-text-dim)" }}><X size={16} /></button>
                </div>
                <form onSubmit={submitRx} className="flex flex-col gap-3">
                  <input className="input-field" placeholder="Medication name *" value={rxData.medication}
                    onChange={(e) => setRxData((d) => ({ ...d, medication: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input-field" placeholder="Dosage *" value={rxData.dosage}
                      onChange={(e) => setRxData((d) => ({ ...d, dosage: e.target.value }))} />
                    <input className="input-field" placeholder="Frequency *" value={rxData.frequency}
                      onChange={(e) => setRxData((d) => ({ ...d, frequency: e.target.value }))} />
                  </div>
                  <input className="input-field" placeholder="Duration (e.g. 7 days)" value={rxData.duration}
                    onChange={(e) => setRxData((d) => ({ ...d, duration: e.target.value }))} />
                  <textarea className="input-field resize-none" rows={2} placeholder="Notes (optional)" value={rxData.notes}
                    onChange={(e) => setRxData((d) => ({ ...d, notes: e.target.value }))} />
                  {rxError && <p className="text-red-500 text-xs" role="alert">{rxError}</p>}
                  <button type="submit" disabled={rxLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {rxLoading ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save Prescription"}
                  </button>
                </form>
              </div>
            )}

            {patient.prescriptions.length === 0 && !rxOpen && (
              <p className="text-center text-sm py-6" style={{ color: "var(--color-text-dim)" }}>No prescriptions yet.</p>
            )}

            {patient.prescriptions.map((rx) => (
              <div key={rx.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Pill size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{rx.medication}</p>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>{fmtDate(rx.issuedAt)}</span>
                </div>
                <div className="flex gap-2 flex-wrap ml-5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                    {rx.dosage}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                    style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                    {rx.frequency}
                  </span>
                  {rx.duration && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                      style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                      <Calendar size={9} className="inline mr-0.5" />{rx.duration}
                    </span>
                  )}
                </div>
                {rx.notes && (
                  <p className="text-xs ml-5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{rx.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── NOTES ── */}
        {tab === "notes" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setNoteOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-500 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/5 transition-colors"
            >
              <Plus size={16} /> Add Medical Note
            </button>

            {noteOpen && (
              <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>New Note</p>
                  <button onClick={() => setNoteOpen(false)} style={{ color: "var(--color-text-dim)" }}><X size={16} /></button>
                </div>
                <form onSubmit={submitNote} className="flex flex-col gap-3">
                  <select className="input-field" value={noteData.type}
                    onChange={(e) => setNoteData((d) => ({ ...d, type: e.target.value }))}>
                    {NOTE_TYPES.map((t) => (
                      <option key={t} value={t}>{NOTE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input className="input-field" placeholder="Title *" value={noteData.title}
                    onChange={(e) => setNoteData((d) => ({ ...d, title: e.target.value }))} />
                  <textarea className="input-field resize-none" rows={5} placeholder="Clinical notes… *" value={noteData.content}
                    onChange={(e) => setNoteData((d) => ({ ...d, content: e.target.value }))} />
                  {noteError && <p className="text-red-500 text-xs" role="alert">{noteError}</p>}
                  <button type="submit" disabled={noteLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {noteLoading ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save Note"}
                  </button>
                </form>
              </div>
            )}

            {patient.medicalNotes.length === 0 && !noteOpen && (
              <p className="text-center text-sm py-6" style={{ color: "var(--color-text-dim)" }}>No notes yet.</p>
            )}

            {patient.medicalNotes.map((note) => (
              <div key={note.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{note.title}</p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: "var(--color-text-dim)" }}>{fmtDate(note.createdAt)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md w-fit font-medium ml-5"
                  style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                  {NOTE_LABELS[note.type] ?? note.type}
                </span>
                <p className="text-xs ml-5 leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-muted)" }}>{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── TESTS ── */}
        {tab === "tests" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setTestOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-emerald-500/40 text-emerald-500 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-500/5 transition-colors"
            >
              <Plus size={16} /> Order Test
            </button>

            {testOpen && (
              <div className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Order New Test</p>
                  <button onClick={() => setTestOpen(false)} style={{ color: "var(--color-text-dim)" }}><X size={16} /></button>
                </div>
                <form onSubmit={submitTest} className="flex flex-col gap-3">
                  <input className="input-field" placeholder="Test name * (e.g. CBC, HbA1c)" value={testData.testName}
                    onChange={(e) => setTestData((d) => ({ ...d, testName: e.target.value }))} />
                  <select className="input-field" value={testData.category}
                    onChange={(e) => setTestData((d) => ({ ...d, category: e.target.value }))}>
                    <option value="">Category (optional)</option>
                    {TEST_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {testError && <p className="text-red-500 text-xs" role="alert">{testError}</p>}
                  <button type="submit" disabled={testLoading}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                    {testLoading ? <><Loader2 size={14} className="animate-spin" />Ordering…</> : "Order Test"}
                  </button>
                </form>
              </div>
            )}

            {patient.orderedTests.length === 0 && !testOpen && (
              <p className="text-center text-sm py-6" style={{ color: "var(--color-text-dim)" }}>No tests ordered yet.</p>
            )}

            {patient.orderedTests.map((test) => (
              <div key={test.id} className="card p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={14} className="text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{test.testName}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0", STATUS_COLORS[test.status] ?? "")}>
                    {test.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-5">
                  {test.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                      style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                      {test.category}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>
                    Ordered {fmtDate(test.orderedAt)}
                  </span>
                </div>
                {test.result && (
                  <div className="ml-5 mt-1 p-2.5 rounded-lg" style={{ backgroundColor: "var(--color-overlay)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: "var(--color-text-dim)" }}>Result</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-muted)" }}>{test.result}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
