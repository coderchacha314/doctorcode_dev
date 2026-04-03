"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Search,
  Bell,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  CloudUpload,
  Shield,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "All Files" | "PDFs" | "Images";
type SortOption = "Recent Date" | "Name" | "Size";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "image";
  date: string;
  size: string;
}

// Mock data — replace with Cloudinary/Supabase calls
const allDocuments: Document[] = [
  { id: "1", name: "Blood_Panel_June_2023.pdf", type: "pdf", date: "Jun 12, 2023", size: "2.4 MB" },
  { id: "2", name: "Chest_Xray_PreOp.jpg", type: "image", date: "May 28, 2023", size: "4.8 MB" },
  { id: "3", name: "Vaccination_Certificate.pdf", type: "pdf", date: "Jan 04, 2023", size: "1.1 MB" },
];

export default function RecordsPage(): React.ReactElement {
  const [tab, setTab] = useState<Tab>("All Files");
  const [sort, setSort] = useState<SortOption>("Recent Date");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = allDocuments.filter((d) => {
    if (tab === "PDFs") return d.type === "pdf";
    if (tab === "Images") return d.type === "image";
    return true;
  });

  async function handleFiles(files: FileList): Promise<void> {
    if (!files.length) return;
    setUploading(true);
    // TODO: upload to Cloudinary via /api/records/upload
    await new Promise((r) => setTimeout(r, 1200));
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Shield size={14} className="text-blue-400" />
          </div>
          <span className="text-base font-semibold text-white">Medical Vault</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
            <Search size={16} />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-colors">
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
            dragging
              ? "border-blue-500 bg-blue-500/10"
              : "border-blue-500/20 bg-[#0f1e35]/50 hover:border-blue-500/40"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <CloudUpload size={28} className="text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Upload New Document</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Drag and drop your medical records here, or click below to browse
              your local files.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-primary px-5 py-2.5 text-sm mt-1"
          >
            {uploading ? (
              <>
                <Upload size={14} className="mr-2 animate-bounce" />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={14} className="mr-2" />+ Select Files
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-blue-500" />
              MILITARY-GRADE ENCRYPTION
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-green-500" />
              HIPAA COMPLIANT
            </span>
          </div>
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="px-4 mt-5 flex items-center justify-between">
        <div className="flex gap-1 bg-[#0f1e35] rounded-xl p-1">
          {(["All Files", "PDFs", "Images"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>SORT BY:</span>
          <button className="flex items-center gap-1 text-slate-300 font-medium">
            {sort}
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Documents list */}
      <div className="px-4 mt-4">
        <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
          Recent Documents
        </h3>
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-slate-500 text-sm">No {tab.toLowerCase()} found</p>
            </div>
          ) : (
            filtered.map((doc) => (
              <div key={doc.id} className="card px-4 py-3 flex items-center gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    doc.type === "pdf"
                      ? "bg-red-500/20"
                      : "bg-blue-500/20"
                  )}
                >
                  {doc.type === "pdf" ? (
                    <FileText size={18} className="text-red-400" />
                  ) : (
                    <ImageIcon size={18} className="text-blue-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doc.date} · {doc.size}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label={`View ${doc.name}`}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                    aria-label={`Download ${doc.name}`}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cloud storage footer */}
        <div className="mt-4 mb-2 flex items-center gap-2">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-slate-600">Cloud Storage</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
      </div>
    </div>
  );
}
