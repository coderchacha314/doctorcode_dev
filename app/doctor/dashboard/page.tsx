"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, LogOut, Stethoscope, ChevronRight, UserPlus, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface PatientCard {
  id: string;
  mrNumber: string;
  fullName: string;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  isLinked?: boolean;
  linkedAt?: string | null;
  latestBS?: { value: number; unit: string } | null;
  latestBP?: { systolic: number; diastolic: number } | null;
}

interface DoctorInfo {
  fullName: string;
  doctorId: string;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function DoctorDashboard(): React.ReactElement {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [searchResults, setSearchResults] = useState<PatientCard[] | null>(null);
  const [mrInput, setMrInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [linking, setLinking] = useState<string | null>(null);

  // Load doctor info + linked patients
  useEffect(() => {
    async function init(): Promise<void> {
      const res = await fetch("/api/doctor/auth/ensure-profile", { method: "POST" });
      if (!res.ok) {
        router.push("/doctor/login");
        return;
      }
      const data = await res.json();
      setDoctor({ fullName: data.fullName, doctorId: data.doctorId });

      const pRes = await fetch("/api/doctor/patients");
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatients(pData.patients ?? []);
      }
    }
    init();
  }, [router]);

  const handleSearch = useCallback(async (): Promise<void> => {
    const q = mrInput.trim().toUpperCase();
    if (!q) { setSearchResults(null); setSearchError(""); return; }
    if (!q.startsWith("MR-") && q.length < 4) {
      setSearchError("Enter a valid MR number (e.g. MR-A1B2C3D4)");
      return;
    }
    setSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/doctor/patients?mr=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error ?? "Search failed"); return; }
      setSearchResults(data.patients ?? []);
    } catch {
      setSearchError("Network error");
    } finally {
      setSearching(false);
    }
  }, [mrInput]);

  async function handleLink(patientId: string): Promise<void> {
    setLinking(patientId);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/link`, { method: "POST" });
      if (res.ok) {
        // Refresh linked patients
        const pRes = await fetch("/api/doctor/patients");
        if (pRes.ok) {
          const data = await pRes.json();
          setPatients(data.patients ?? []);
        }
        // Mark as linked in search results
        setSearchResults((prev) =>
          prev ? prev.map((p) => p.id === patientId ? { ...p, isLinked: true } : p) : prev
        );
      }
    } finally {
      setLinking(null);
    }
  }

  async function handleSignOut(): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/doctor/login");
  }

  const displayList = searchResults ?? patients;
  const isSearchMode = searchResults !== null;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4 border-b"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Stethoscope size={16} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <span className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold tracking-wider uppercase">
              Doctor Portal
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            {doctor ? `Dr. ${doctor.fullName}` : "Doctor Dashboard"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {patients.length} patient{patients.length !== 1 ? "s" : ""} linked
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-4">
        {/* Search by MR */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Search Patient by MR Number
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="MR-A1B2C3D4"
              value={mrInput}
              onChange={(e) => {
                setMrInput(e.target.value);
                setSearchError("");
                if (!e.target.value.trim()) setSearchResults(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input-field flex-1 font-mono text-sm"
              style={{ textTransform: "uppercase" }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 min-w-[80px]"
            >
              {searching ? "…" : "Search"}
            </button>
            {isSearchMode && (
              <button
                onClick={() => { setSearchResults(null); setMrInput(""); setSearchError(""); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchError && <p className="text-red-500 text-xs" role="alert">{searchError}</p>}
        </div>

        {/* Patient list */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <Users size={14} style={{ color: "var(--color-text-dim)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              {isSearchMode ? `Search Results (${displayList.length})` : "My Patients"}
            </span>
          </div>

          {displayList.length === 0 && (
            <div
              className="card p-8 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              {isSearchMode
                ? "No patient found with this MR number."
                : "No patients linked yet. Search by MR number to add patients."}
            </div>
          )}

          {displayList.map((patient) => {
            const age = calcAge(patient.dateOfBirth);
            const isLinkedPatient = !isSearchMode || patient.isLinked;

            return (
              <div key={patient.id} className="card p-4 flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{
                    backgroundColor: "var(--color-overlay)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {patient.fullName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>
                      {patient.fullName}
                    </p>
                    {patient.bloodType && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex-shrink-0">
                        {patient.bloodType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs font-mono" style={{ color: "var(--color-text-dim)" }}>
                      {patient.mrNumber}
                    </span>
                    {age !== null && (
                      <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>· {age}y</span>
                    )}
                    {patient.gender && (
                      <span className="text-xs" style={{ color: "var(--color-text-dim)" }}>· {patient.gender}</span>
                    )}
                  </div>
                  {/* Latest vitals */}
                  {(patient.latestBS || patient.latestBP) && (
                    <div className="flex gap-3 mt-1.5">
                      {patient.latestBS && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                          BS {Math.round(patient.latestBS.value)} {patient.latestBS.unit}
                        </span>
                      )}
                      {patient.latestBP && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
                          BP {patient.latestBP.systolic}/{patient.latestBP.diastolic}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action */}
                {isSearchMode && !patient.isLinked ? (
                  <button
                    onClick={() => handleLink(patient.id)}
                    disabled={linking === patient.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <UserPlus size={12} />
                    {linking === patient.id ? "…" : "Add"}
                  </button>
                ) : (
                  <Link href={`/doctor/patients/${patient.id}`} className="flex-shrink-0">
                    <ChevronRight size={18} style={{ color: "var(--color-text-dim)" }} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
