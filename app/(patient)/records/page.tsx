"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Bell, FileText, Image as ImageIcon, Eye, Download, Trash2, CloudUpload, Shield, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Tab = "All Files" | "PDFs" | "Images";

interface MedicalRecord {
  id: string;
  name: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RecordsPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>("All Files");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch("/api/records");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter((d) => {
    if (tab === "PDFs")   return d.fileType === "pdf";
    if (tab === "Images") return d.fileType === "image";
    return true;
  });

  async function handleFiles(files: FileList): Promise<void> {
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setUploadError("Not authenticated"); return; }

      for (const file of Array.from(files)) {
        const fileType = file.type.startsWith("image/") ? "image" : "pdf";
        const ext = file.name.split(".").pop() ?? (fileType === "pdf" ? "pdf" : "jpg");
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { error: uploadErr } = await supabase.storage
          .from("medical-records")
          .upload(path, file, { contentType: file.type });

        if (uploadErr) { setUploadError(uploadErr.message); return; }

        // Get the storage URL (not public — will use signed URL for access)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const fileUrl = `${supabaseUrl}/storage/v1/object/medical-records/${path}`;

        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, fileUrl, fileType, fileSize: file.size }),
        });
        if (!res.ok) {
          const data = await res.json();
          setUploadError(data.error ?? "Failed to save record");
          return;
        }
        void ext; // suppress unused warning
      }
      await fetchRecords();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function getSignedUrl(recordId: string): Promise<string | null> {
    const res = await fetch("/api/records/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.signedUrl ?? null;
  }

  async function handleView(doc: MedicalRecord): Promise<void> {
    setViewingId(doc.id);
    try {
      const url = await getSignedUrl(doc.id);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setViewingId(null);
    }
  }

  async function handleDownload(doc: MedicalRecord): Promise<void> {
    setDownloadingId(doc.id);
    try {
      const url = await getSignedUrl(doc.id);
      if (!url) return;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setDeletingId(id);
    try {
      await fetch(`/api/records/${id}`, { method: "DELETE" });
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Shield size={14} className="text-blue-500 dark:text-blue-400" />
          </div>
          <span className="text-base font-semibold" style={{ color: "var(--color-text)" }}>Medical Vault</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
            <Search size={16} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:opacity-80"
            style={{ backgroundColor: "var(--color-overlay)", color: "var(--color-text-muted)" }}>
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div className="px-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-all duration-150",
            dragging ? "border-blue-500 bg-blue-500/10" : "border-blue-500/20 hover:border-blue-500/40"
          )}
          style={!dragging ? { backgroundColor: "var(--color-surface)" } : {}}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <CloudUpload size={28} className="text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Upload New Document</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Drag and drop your medical records here, or click below to browse files.
            </p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-primary px-5 py-2.5 text-sm mt-1">
            {uploading ? (
              <><Loader2 size={14} className="mr-2 animate-spin" />Uploading…</>
            ) : (
              <><CloudUpload size={14} className="mr-2" />+ Select Files</>
            )}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
          {uploadError && <p className="text-red-500 text-xs text-center" role="alert">{uploadError}</p>}
          <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--color-text-dim)" }}>
            <span className="flex items-center gap-1"><Shield size={10} className="text-blue-500" /> ENCRYPTED STORAGE</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Shield size={10} className="text-green-500" /> HIPAA COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="px-4 mt-5 flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
          {(["All Files", "PDFs", "Images"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tab === t ? "bg-blue-600 text-white" : "")}
              style={tab !== t ? { color: "var(--color-text-muted)" } : {}}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>SORT BY:</span>
          <button className="flex items-center gap-1 font-medium" style={{ color: "var(--color-text-2)" }}>
            Recent Date <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div className="px-4 mt-4 pb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-dim)" }}>
          {tab}
        </h3>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No {tab.toLowerCase()} found. Upload a document above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((doc) => (
              <div key={doc.id} className="card px-4 py-3 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  doc.fileType === "pdf" ? "bg-red-500/20" : "bg-blue-500/20")}>
                  {doc.fileType === "pdf"
                    ? <FileText size={18} className="text-red-500 dark:text-red-400" />
                    : <ImageIcon size={18} className="text-blue-500 dark:text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>{doc.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {formatDate(doc.uploadedAt)} · {formatSize(doc.fileSize)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleView(doc)}
                    disabled={viewingId === doc.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{ color: "var(--color-text-muted)" }}
                    aria-label={`View ${doc.name}`}
                  >
                    {viewingId === doc.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{ color: "var(--color-text-muted)" }}
                    aria-label={`Download ${doc.name}`}
                  >
                    {downloadingId === doc.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Download size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-red-500/60 hover:text-red-500 disabled:opacity-40"
                    aria-label={`Delete ${doc.name}`}
                  >
                    {deletingId === doc.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 mb-2 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-divider)" }} />
          <span className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>Supabase Encrypted Storage</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--color-divider)" }} />
        </div>
      </div>
    </div>
  );
}
