"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaRef } from "@/lib/data";
import type { MediaRow } from "@/lib/db";

export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaRef) => void;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setLoading(true);
      const url =
        filter === "all"
          ? "/api/admin/media"
          : `/api/admin/media?kind=${filter}`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => setItems(data as MediaRow[]))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [open, filter]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
        onClick={onClose}
      />
      <div
        className="relative mx-4 flex max-h-[80dvh] w-full max-w-2xl flex-col rounded-2xl shadow-2xl"
        style={{ backgroundColor: "#1c1915", zIndex: 1 }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.1em]">
            Select from media library
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[11px] uppercase tracking-[0.16em] opacity-50 transition-opacity hover:opacity-100"
          >
            Close
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          {(["all", "image", "video"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilter(kind)}
              className={`cursor-pointer rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                filter === kind
                  ? "bg-yellow/20 text-yellow"
                  : "opacity-50 hover:opacity-90"
              }`}
            >
              {kind}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-8 text-center text-[11px] uppercase tracking-[0.2em] opacity-40">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-[11px] uppercase tracking-[0.2em] opacity-40">
              No media uploaded yet.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect({
                        type: item.kind === "video" ? "video" : "image",
                        src: item.url,
                      });
                      onClose();
                    }}
                    className="group w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 transition-colors hover:border-yellow/60"
                  >
                    <div
                      className="relative aspect-square bg-cover bg-center"
                      style={{
                        backgroundImage:
                          item.kind === "image"
                            ? `url(${item.url})`
                            : "linear-gradient(140deg, #2a3f4d, #101b23)",
                      }}
                    >
                      {item.kind === "video" && (
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/70">
                          ▶ Video
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[10px] font-medium">
                        {item.title || item.filename}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
