"use client";

import { useState } from "react";

/**
 * Collapsible "About playlists" panel on the playlists overview page.
 * Collapsed by default so the playlist covers own the first screen;
 * tap the chevron to reveal or hide the description.
 */
export function PlaylistAboutToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute inset-x-0 top-24 z-20 flex justify-center px-6 md:top-28">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background/90 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[11px] uppercase tracking-[0.22em] opacity-60">
            About playlists
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 opacity-60 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div
          className={`grid transition-all duration-300 ease-out ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="px-4 pb-4 text-[13px] leading-relaxed opacity-80">
              Curated Yellow White Noise playlists — label tracks and
              hand-picked selections, streaming on all platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
