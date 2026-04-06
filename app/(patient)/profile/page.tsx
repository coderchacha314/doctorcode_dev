"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, CheckCircle, ChevronRight, LogOut, Moon, Sun, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ProfileData {
  fullName: string;
  email: string;
  mobile: string | null;
  gender: string | null;
  avatarUrl: string | null;
  patient: {
    dateOfBirth: string | null;
  } | null;
}

function formatDOB(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function ProfilePage(): React.ReactElement {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings/profile")
      .then((r) => r.json())
      .then((data) => { if (data.profile) setProfile(data.profile); })
      .catch(() => {});
  }, []);

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) { console.error(uploadError); return; }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      // Save to profile
      await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });

      setProfile((p) => p ? { ...p, avatarUrl: publicUrl } : p);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <Link href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}
          aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>Profile</h1>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-dim)" }}>Digital Sanctuary</span>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mt-4 mb-6 px-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-800/30 border-2 border-blue-500/30 flex items-center justify-center overflow-hidden">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-blue-500 dark:text-blue-400">{initials}</span>
            )}
          </div>
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {uploadingPhoto
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <Camera size={14} className="text-white" />}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <h2 className="text-xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
          {profile?.fullName ?? "—"}
        </h2>
        <span className="text-xs font-medium px-3 py-1 mt-1.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
          <span className="text-[10px]">🏥</span>
          PATIENT
        </span>
      </div>

      {/* Personal Information */}
      <div className="px-4 mb-4">
        <SectionDivider label="Personal Information" />
        <div className="card overflow-hidden">
          <InfoRow label="Full Name"     value={profile?.fullName ?? "—"} />
          <InfoRow label="Mobile Number" value={profile?.mobile ?? "—"} />
          <InfoRow label="Email Address" value={profile?.email ?? "—"} verified />
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: "var(--color-divider)" }}>
            <InfoRow label="Date of Birth" value={formatDOB(profile?.patient?.dateOfBirth)} border={false} />
            <InfoRow label="Gender"        value={profile?.gender ?? "—"}                   border={false} />
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="px-4 mb-4">
        <SectionDivider label="System Settings" />
        <div className="flex flex-col gap-2">
          <div className="card p-4">
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>Appearance</p>
            <p className="text-xs mt-0.5 mb-3" style={{ color: "var(--color-text-muted)" }}>
              Select your preferred visual style
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl" style={{ backgroundColor: "var(--color-bg)" }}>
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  theme === "light" ? "bg-white text-gray-900 shadow dark:shadow-none" : ""
                )}
                style={theme !== "light" ? { color: "var(--color-text-muted)" } : {}}
              >
                <Sun size={14} /> Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  theme === "dark" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : ""
                )}
                style={theme !== "dark" ? { color: "var(--color-text-muted)" } : {}}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>

          <SettingsRow icon="🔒" label="Privacy & Security"      href="/profile/privacy" />
          <SettingsRow icon="🔔" label="Notification Preferences" href="/profile/notifications" />
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mb-6">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-colors min-h-[52px] text-red-500 dark:text-red-400 border border-red-500/20 hover:bg-red-500/10 disabled:opacity-60"
          style={{ backgroundColor: "rgba(239,68,68,0.08)" }}
        >
          {loggingOut ? (
            <><Loader2 size={16} className="animate-spin" /> Logging out…</>
          ) : (
            <><LogOut size={16} /> Logout</>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] pb-4" style={{ color: "var(--color-text-dim)" }}>
        DIGITAL SANCTUARY V4.2.0 — SECURE CLINICAL INSTANCE
      </p>
    </div>
  );
}

function SectionDivider({ label }: { label: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1" style={{ backgroundColor: "var(--color-divider)" }} />
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-dim)" }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: "var(--color-divider)" }} />
    </div>
  );
}

function InfoRow({ label, value, verified, border = true }: {
  label: string; value: string; verified?: boolean; border?: boolean;
}): React.ReactElement {
  return (
    <div className="px-4 py-3" style={border ? { borderBottom: "1px solid var(--color-divider)" } : {}}>
      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--color-text-dim)" }}>{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm" style={{ color: "var(--color-text)" }}>{value}</p>
        {verified && <CheckCircle size={14} className="text-green-500 flex-shrink-0" />}
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, href }: { icon: string; label: string; href: string }): React.ReactElement {
  return (
    <Link href={href}>
      <div className="card px-4 py-4 flex items-center gap-3 hover:border-blue-500/30 active:scale-[0.98] transition-all">
        <span className="text-base">{icon}</span>
        <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-text)" }}>{label}</span>
        <ChevronRight size={16} style={{ color: "var(--color-text-dim)" }} />
      </div>
    </Link>
  );
}
