"use client";

import type { ReactNode } from "react";
import { useUIStore } from "@/lib/store/ui";

/**
 * Tap-to-hide wrapper for individual playlist pages. When enabled, tapping
 * the page fades out the top bar and hero (cover, title, streaming icons)
 * along with the global brand logo and bottom nav (both hide on `immersed`).
 * Interactive zones (tracks, footer links) stop propagation so using them
 * never triggers the hide.
 */
export function PlaylistImmersed({
  enabled,
  topBar,
  hero,
  children,
}: {
  enabled: boolean;
  topBar: ReactNode;
  hero: ReactNode;
  children: ReactNode;
}) {
  const immersed = useUIStore((s) => s.immersed);
  const toggleImmersed = useUIStore((s) => s.toggleImmersed);
  const faded = immersed
    ? "pointer-events-none opacity-0"
    : "opacity-100";

  return (
    <main
      onClick={() => {
        if (enabled) toggleImmersed();
      }}
      className={`min-h-dvh bg-background ${enabled ? "cursor-pointer" : ""}`}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`transition-opacity duration-700 ${faded}`}
      >
        {topBar}
      </div>
      <div className={`transition-opacity duration-700 ${faded}`}>{hero}</div>
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </main>
  );
}
