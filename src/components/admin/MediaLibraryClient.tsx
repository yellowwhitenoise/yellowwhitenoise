"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MediaRef } from "@/lib/data";
import type { MediaRow } from "@/lib/db";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";
import { MpegTsVideo } from "@/components/MpegTsVideo";
import { ZoomableImage } from "@/components/ZoomableImage";
import { prepareReverseVideo } from "@/lib/media-playback";

type MediaFilter = "all" | "image" | "video";
type MediaSort = "recent" | "oldest";

const inputClass =
  "rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow";

const menuItemClass =
  "block w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[10px] uppercase tracking-[0.14em] transition-colors hover:bg-foreground/10 disabled:cursor-default disabled:opacity-40";

const filterOptions: { value: MediaFilter; label: string }[] = [
  { value: "all", label: "All files" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

const sortOptions: { value: MediaSort; label: string }[] = [
  { value: "recent", label: "Recent first" },
  { value: "oldest", label: "Oldest first" },
];

function uploadDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration || null);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
    video.src = URL.createObjectURL(file);
  });
}

function mediaDate(value: string): number {
  const parsed = new Date(`${value.replace(" ", "T")}Z`).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function MediaLibraryClient({
  initial,
  initialBackdrop,
}: {
  initial: MediaRow[];
  initialBackdrop?: MediaRef | null;
}) {
  const router = useRouter();
  const [media, setMedia] = useState(initial);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaRow | null>(null);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [sort, setSort] = useState<MediaSort>("recent");
  const [backdrop, setBackdrop] = useState<MediaRef | null>(
    initialBackdrop ?? null,
  );
  const [backdropBusy, setBackdropBusy] = useState(false);

  const upload = async (file: File, kind: "image" | "video") => {
    setUploading(kind);
    setError(null);
    setNotice(null);
    const duration = kind === "video" ? await uploadDuration(file) : null;
    const form = new FormData();
    form.append("file", file);
    if (duration) form.append("duration", String(Math.round(duration)));
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const data = (await response.json().catch(() => ({}))) as {
      id?: number;
      error?: string;
    };
    setUploading(null);
    if (!response.ok || !data.id) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    router.refresh();
    const fresh = await fetch("/api/admin/media");
    if (fresh.ok) setMedia((await fresh.json()) as MediaRow[]);
    setNotice("Media uploaded.");
  };

  const setHomeBackdrop = async (entry: MediaRow) => {
    setBackdropBusy(true);
    setError(null);
    setNotice(null);
    const value: MediaRef = {
      type: entry.kind === "video" ? "video" : "image",
      src: entry.url,
    };
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "home_backdrop",
        value: JSON.stringify(value),
      }),
    });
    setBackdropBusy(false);
    if (!response.ok) {
      setError("Could not set the homepage backdrop.");
      return;
    }
    setBackdrop(value);
    setNotice("This file is now the homepage and playlist backdrop.");
    router.refresh();
  };

  const clearHomeBackdrop = async () => {
    setBackdropBusy(true);
    setError(null);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "home_backdrop", value: "" }),
    });
    setBackdropBusy(false);
    if (!response.ok) {
      setError("Could not remove the homepage backdrop.");
      return;
    }
    setBackdrop(null);
    setNotice("The homepage and playlist backdrop was removed.");
    router.refresh();
  };

  const updateBackdropLoop = async (loopBackwards: boolean) => {
    if (!backdrop || backdrop.type !== "video") return;
    setBackdropBusy(true);
    setError(null);
    try {
      const prepared =
        loopBackwards && backdrop.reverseSrc && backdrop.playbackSrc
          ? {
              playbackUrl: backdrop.playbackSrc,
              reverseUrl: backdrop.reverseSrc,
            }
          : loopBackwards
            ? await prepareReverseVideo(backdrop.src)
            : null;
      const value = {
        ...backdrop,
        loopBackwards,
        ...(prepared
          ? {
              playbackSrc: prepared.playbackUrl,
              reverseSrc: prepared.reverseUrl,
            }
          : {}),
      };
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "home_backdrop",
          value: JSON.stringify(value),
        }),
      });
      if (!response.ok) {
        setError("Could not update the backdrop playback mode.");
        return;
      }
      setBackdrop(value);
      setNotice(
        loopBackwards
          ? "Backdrop will play forward and backward smoothly."
          : "Backdrop will use a normal forward loop.",
      );
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not prepare reverse playback.",
      );
    } finally {
      setBackdropBusy(false);
    }
  };

  const remove = async (entry: MediaRow) => {
    const response = await fetch(`/api/admin/media?id=${entry.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError("Could not delete this file.");
      return;
    }
    setMedia((current) => current.filter((item) => item.id !== entry.id));
    if (preview?.id === entry.id) setPreview(null);
    if (backdrop?.src === entry.url) await clearHomeBackdrop();
    setNotice("Media deleted.");
  };

  const imageInput = (kind: "image") => (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file, kind);
        event.target.value = "";
      }}
    />
  );

  const visibleMedia = [...media]
    .filter((entry) => filter === "all" || entry.kind === filter)
    .sort((a, b) => {
      const difference = mediaDate(a.uploaded_at) - mediaDate(b.uploaded_at);
      return sort === "recent" ? -difference : difference;
    });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-12">
      <Link
        href="/admin"
        className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
      >
        ← Dashboard
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-[0.1em]">
          Media library
        </h1>
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10">
            {uploading === "image" ? "Uploading…" : "+ Upload image"}
            {imageInput("image")}
          </label>
          <label className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10">
            {uploading === "video" ? "Uploading…" : "+ Upload video"}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/mp2t,video/x-matroska,.ts,.mkv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file, "video");
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
      <p className="mt-2 text-[12px] opacity-50">
        Reusable images and videos for artists, blog posts, and site backdrops.
      </p>

      {backdrop && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-yellow/25 bg-yellow/[0.04] px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-yellow">
              Homepage + playlist backdrop is set
            </p>
            {backdrop.type === "video" && (
              <label className="mt-2 flex items-center gap-2 text-[10px] normal-case tracking-normal text-foreground opacity-75">
                <input
                  type="checkbox"
                  checked={Boolean(backdrop.loopBackwards)}
                  onChange={(event) =>
                    void updateBackdropLoop(event.target.checked)
                  }
                  disabled={backdropBusy}
                  className="h-4 w-4 accent-yellow"
                />
                Play forward, then backward
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={() => void clearHomeBackdrop()}
            disabled={backdropBusy}
            className="cursor-pointer text-[10px] uppercase tracking-[0.16em] underline underline-offset-4 opacity-70 hover:opacity-100 disabled:opacity-40"
          >
            Remove backdrop
          </button>
        </div>
      )}

      <div className="relative z-40 mt-6 flex flex-wrap items-center gap-3 overflow-visible border-y border-foreground/10 py-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] opacity-55">
          <span>File type</span>
          <ResponsiveMenu
            label="File type"
            activeLabel={
              filterOptions.find((option) => option.value === filter)?.label
            }
            buttonClassName={inputClass}
            menuClassName="w-44"
          >
            {(close) => (
              <div>
                <p className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] opacity-45">
                  File type
                </p>
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value);
                      close();
                    }}
                    className={`${menuItemClass} ${
                      filter === option.value ? "text-yellow" : ""
                    }`}
                  >
                    {filter === option.value ? "✓ " : ""}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </ResponsiveMenu>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] opacity-55">
          <span>Sort</span>
          <ResponsiveMenu
            label="Sort media"
            activeLabel={
              sortOptions.find((option) => option.value === sort)?.label
            }
            buttonClassName={inputClass}
            menuClassName="w-44"
          >
            {(close) => (
              <div>
                <p className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] opacity-45">
                  Sort
                </p>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSort(option.value);
                      close();
                    }}
                    className={`${menuItemClass} ${
                      sort === option.value ? "text-yellow" : ""
                    }`}
                  >
                    {sort === option.value ? "✓ " : ""}
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </ResponsiveMenu>
        </div>
        <span className="ml-auto text-[10px] uppercase tracking-[0.16em] opacity-40">
          {visibleMedia.length} file{visibleMedia.length === 1 ? "" : "s"}
        </span>
      </div>

      {error && <p className="mt-4 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-4 text-[12px] text-yellow">{notice}</p>}

      {media.length === 0 ? (
        <p className="mt-10 text-[12px] opacity-50">
          Nothing uploaded yet. Images and videos you upload appear here as
          reusable assets.
        </p>
      ) : visibleMedia.length === 0 ? (
        <p className="mt-10 text-[12px] opacity-50">
          No files match this filter.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibleMedia.map((entry) => {
            const isBackdrop = backdrop?.src === entry.url;
            return (
              <li
                key={entry.id}
                className="group relative overflow-visible rounded-2xl border border-foreground/10"
              >
                <button
                  type="button"
                  onClick={() => setPreview(entry)}
                  className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-t-2xl bg-cover bg-center"
                  style={{
                    backgroundImage:
                      entry.kind === "image"
                        ? `url(${entry.url})`
                        : "linear-gradient(140deg, #2a3f4d, #101b23)",
                  }}
                >
                  {entry.kind === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] text-white/70">
                      ▶ Play
                    </span>
                  )}
                </button>
                <div className="p-3">
                  <p className="truncate text-[11px] font-medium">
                    {entry.title || entry.filename}
                  </p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] opacity-40">
                    {entry.kind} · {(entry.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {isBackdrop && (
                    <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-yellow">
                      Current backdrop
                    </p>
                  )}
                </div>
                <div className="absolute right-2 top-2 z-10">
                  <ResponsiveMenu
                    label={`Actions for ${entry.title || entry.filename}`}
                    align="right"
                    menuClassName="w-52"
                    buttonClassName="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/90 hover:text-white"
                    trigger={
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden
                      >
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    }
                  >
                    {(close) => (
                      <>
                      <button
                        type="button"
                        onClick={() => {
                          setPreview(entry);
                          close();
                        }}
                        className={menuItemClass}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          void setHomeBackdrop(entry);
                        }}
                        disabled={backdropBusy || isBackdrop}
                        className={menuItemClass}
                      >
                        {isBackdrop
                          ? "Current home + playlist backdrop"
                          : "Set as home + playlist backdrop"}
                      </button>
                      {isBackdrop && (
                        <button
                          type="button"
                          onClick={() => {
                            close();
                            void clearHomeBackdrop();
                          }}
                          disabled={backdropBusy}
                          className={menuItemClass}
                        >
                          Remove as backdrop
                        </button>
                      )}
                      <a
                        href={`${entry.url}${entry.url.includes("?") ? "&" : "?"}download=1`}
                        download={entry.filename}
                        onClick={close}
                        className={menuItemClass}
                      >
                        Download file
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          void remove(entry);
                        }}
                        className={`${menuItemClass} text-red-400/85 hover:bg-red-400/10`}
                      >
                        Delete file
                      </button>
                      </>
                    )}
                  </ResponsiveMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 isolate flex items-center justify-center">
          <div
            className="absolute inset-0 z-0 bg-black/80"
            onClick={() => setPreview(null)}
          />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 z-20 cursor-pointer text-sm uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white"
          >
            ✕ Close
          </button>
          <div className="relative z-10 mx-4 max-h-[85dvh] max-w-[90vw]">
            {preview.kind === "image" ? (
              <ZoomableImage
                src={preview.url}
                alt={preview.title || preview.filename}
              />
            ) : preview.filename.toLowerCase().endsWith(".ts") ? (
              <MpegTsVideo
                src={preview.url}
                controls
                autoPlay
                muted={false}
                loop={false}
                className="max-h-[85dvh] max-w-[90vw] rounded-xl"
              />
            ) : (
              <video
                src={preview.url}
                controls
                autoPlay
                className="max-h-[85dvh] max-w-[90vw] rounded-xl"
              />
            )}
          </div>
          <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] text-white/50">
            {preview.title || preview.filename}
          </p>
        </div>
      )}
    </main>
  );
}
