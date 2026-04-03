"use client";

import { useState } from "react";
import { ArrowLeft, Camera, CheckCircle, ChevronRight, LogOut, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Theme = "Light" | "Dark";

// Mock — replace with real session data
const patient = {
  name: "Eleanor Thorne",
  clinicalId: "#88221-ET",
  fullName: "Eleanor Thorne",
  mobile: "+1 (555) 234-8891",
  email: "e.thorne@clinical.sanctuary.io",
  dob: "April 12, 1988",
  gender: "Female",
  avatarUrl: null as string | null,
};

export default function ProfilePage(): React.ReactElement {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("Dark");

  function handleLogout(): void {
    // TODO: call Supabase signOut
    router.push("/login");
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-white">Profile</h1>
        <span className="text-xs text-slate-500 font-medium">Digital Sanctuary</span>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mt-4 mb-6 px-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-800/30 border-2 border-blue-500/30 flex items-center justify-center overflow-hidden">
            {patient.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patient.avatarUrl} alt={patient.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-blue-400">
                {patient.name.split(" ").map((n) => n[0]).join("")}
              </span>
            )}
          </div>
          <button
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
            aria-label="Change profile photo"
          >
            <Camera size={14} className="text-white" />
          </button>
        </div>
        <h2 className="text-xl font-bold text-white mt-3">{patient.name}</h2>
        <span className="text-xs font-medium px-3 py-1 mt-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
          <span className="text-[10px]">🏥</span>
          CLINICAL ID: {patient.clinicalId}
        </span>
      </div>

      {/* Personal Information */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Personal Information
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="card overflow-hidden">
          <InfoRow label="Full Name" value={patient.fullName} />
          <div className="h-px bg-white/5" />
          <InfoRow label="Mobile Number" value={patient.mobile} />
          <div className="h-px bg-white/5" />
          <InfoRow
            label="Email Address"
            value={patient.email}
            verified
          />
          <div className="h-px bg-white/5" />
          <div className="grid grid-cols-2">
            <InfoRow label="Date of Birth" value={patient.dob} border={false} />
            <InfoRow label="Gender" value={patient.gender} border={false} />
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            System Settings
          </span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <div className="flex flex-col gap-2">
          {/* Appearance toggle */}
          <div className="card p-4">
            <p className="text-sm font-medium text-slate-200">Appearance</p>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Select your preferred visual style
            </p>
            <div className="grid grid-cols-2 gap-2 bg-[#0b1628] p-1 rounded-xl">
              <button
                onClick={() => setTheme("Light")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  theme === "Light"
                    ? "bg-white text-gray-900 shadow"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Sun size={14} />
                Light
              </button>
              <button
                onClick={() => setTheme("Dark")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  theme === "Dark"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Moon size={14} />
                Dark
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <SettingsRow
            icon="🔒"
            label="Privacy & Security"
            href="/profile/privacy"
          />

          {/* Notifications */}
          <SettingsRow
            icon="🔔"
            label="Notification Preferences"
            href="/profile/notifications"
          />
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold text-sm transition-colors border border-red-500/20 min-h-[52px]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-slate-700 pb-4">
        DIGITAL SANCTUARY V4.2.0 — SECURE CLINICAL INSTANCE
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  verified,
  border = true,
}: {
  label: string;
  value: string;
  verified?: boolean;
  border?: boolean;
}): React.ReactElement {
  return (
    <div className={cn("px-4 py-3", border && "border-b border-white/5")}>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm text-slate-200">{value}</p>
        {verified && (
          <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  href,
}: {
  icon: string;
  label: string;
  href: string;
}): React.ReactElement {
  return (
    <Link href={href}>
      <div className="card px-4 py-4 flex items-center gap-3 hover:border-blue-500/30 active:scale-[0.98] transition-all">
        <span className="text-base">{icon}</span>
        <span className="flex-1 text-sm font-medium text-slate-200">{label}</span>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
    </Link>
  );
}
