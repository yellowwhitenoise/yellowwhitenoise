"use client";

import { useRef, useState } from "react";
import type { MediaRef } from "@/lib/data";
import { MediaPickerDialog } from "./MediaPickerDialog";
import { MpegTsVideo } from "@/components/MpegTsVideo";
import { PingPongVideo } from "@/components/PingPongVideo";
import { prepareReverseVideo } from "@/lib/media-playback";

export function MediaRefUploadField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value?: MediaRef;
  onChange: (media: MediaRef | null) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preparingLoop, setPreparingLoop] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    let duration: number | null = null;
    const VIDEO_EXTS = /\.(mp4|webm|mov|ts|mkv)$/i;
    const isVideo =
      file.type.startsWith("video/") || VIDEO_EXTS.test(file.name);
    if (isVideo) {
      try {
        duration = await new Promise<number | null>((resolve) => {
          const video = document.createElement("video");
          video.preload = "metadata";
          video.onloadedmetadata = () => resolve(video.duration || null);
          video.onerror = () => resolve(null);
          video.src = URL.createObjectURL(file);
        });
      } catch {
        duration = null;
      }
    }
    const form = new FormData();
    form.append("file", file);
    if (duration) form.append("duration", String(Math.round(duration)));
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      kind?: string;
      error?: string;
    };
    setUploading(false);
    if (response.ok && data.url && data.kind) {
      onChange({
        type: data.kind === "video" ? "video" : "image",
        src: data.url,
      });
    } else {
      setError(data.error ?? "Upload failed.");
    }
  };

  const setLoopBackwards = async (enabled: boolean) => {
    if (!value || value.type !== "video") return;
    if (!enabled) {
      onChange({ ...value, loopBackwards: false });
      return;
    }
    if (value.reverseSrc && value.playbackSrc) {
      onChange({ ...value, loopBackwards: true });
      return;
    }
    setPreparingLoop(true);
    setError(null);
    try {
      const prepared = await prepareReverseVideo(value.src);
      onChange({
        ...value,
        loopBackwards: true,
        playbackSrc: prepared.playbackUrl,
        reverseSrc: prepared.reverseUrl,
      });
    } catch (preparationError) {
      setError(
        preparationError instanceof Error
          ? preparationError.message
          : "Could not prepare reverse playback.",
      );
    } finally {
      setPreparingLoop(false);
    }
  };

  return (
    <div className="block min-w-0 max-w-full overflow-hidden text-[10px] uppercase tracking-[0.22em] opacity-50">
      {label}
      <div className="mt-2 flex min-w-0 max-w-full flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
        >
          Choose from media
        </button>
        {value && (
          <>
            <span className="min-w-0 max-w-full flex-1 truncate text-[10px] uppercase tracking-[0.14em] opacity-40">
              {value.type} ✓
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="shrink-0 cursor-pointer text-[10px] uppercase tracking-[0.16em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
            >
              Remove
            </button>
          </>
        )}
      </div>
      {value?.type === "video" && (
        <label className="mt-3 flex items-center gap-2 text-[10px] normal-case tracking-normal opacity-70">
          <input
            type="checkbox"
            checked={Boolean(value.loopBackwards)}
            onChange={(event) => void setLoopBackwards(event.target.checked)}
            disabled={preparingLoop}
            className="h-4 w-4 accent-yellow"
          />
          {preparingLoop
            ? "Preparing smooth reverse playback…"
            : "Play forward, then backward"}
        </label>
      )}
      {value && (
        <div className="mt-2 min-w-0 max-w-full overflow-hidden rounded-xl border border-foreground/10">
          {value.type === "video" ? (
            value.loopBackwards && value.reverseSrc && value.playbackSrc ? (
              <PingPongVideo
                src={value.playbackSrc}
                reverseSrc={value.reverseSrc}
                className="max-h-32 w-auto max-w-full"
                controls
                muted
                loop
                loopBackwards
              />
            ) : value.src.toLowerCase().split("?")[0].endsWith(".ts") ? (
              <MpegTsVideo
                src={value.src}
                className="max-h-32 w-auto max-w-full"
                controls
                muted
                loop
              />
            ) : (
              <PingPongVideo
                src={value.playbackSrc ?? value.src}
                className="max-h-32 w-auto max-w-full"
                controls
                muted
                loop
              />
            )
          ) : (
            <img
              src={value.src}
              alt=""
              className="max-h-32 w-auto max-w-full object-cover"
            />
          )}
        </div>
      )}
      {hint && (
        <p className="mt-1.5 min-w-0 max-w-full text-[10px] normal-case tracking-normal break-words opacity-40 [overflow-wrap:anywhere]">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 min-w-0 max-w-full text-[11px] break-words text-red-400 [overflow-wrap:anywhere]">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/mp2t,video/x-matroska"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(media) => onChange(media)}
      />
    </div>
  );
}
