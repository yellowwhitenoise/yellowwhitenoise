"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    setUploading(false);
    if (response.ok && data.url) {
      onChange(data.url);
    } else {
      setError(data.error ?? "Upload failed.");
    }
  };

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-2 overflow-hidden">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "https://… or upload from device"}
        className="w-full min-w-0 max-w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow"
      />
      <div className="flex min-w-0 max-w-full items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload from device"}
        </button>
        {value && (
          <span className="min-w-0 flex-1 truncate text-[10px] uppercase tracking-[0.14em] opacity-40">
            {value.startsWith("/api/uploads/") ? "Uploaded ✓" : value}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
