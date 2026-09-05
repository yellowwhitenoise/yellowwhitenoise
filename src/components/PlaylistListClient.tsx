"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackdropMedia } from "@/components/BackdropMedia";
import { PlaylistAboutToggle } from "@/components/PlaylistAboutToggle";
import { triggerHaptic } from "@/lib/haptics";
import type { MediaRef, Playlist } from "@/lib/data";
import { useUIStore } from "@/lib/store/ui";

const LEAVE_DURATION_MS = 300;

/**
 * Playlist overview strip. When tap-to-hide is enabled, tapping the page
 * fades out the playlist covers (plus the global brand logo and bottom
 * nav, which hide on `immersed`). Tap again to bring everything back.
 * Opening a playlist fades everything out first, then navigates.
 */
export function PlaylistListClient({
  playlists,
  backdrop,
  tapHideEnabled = true,
}: {
  playlists: Playlist[];
  backdrop?: MediaRef;
  tapHideEnabled?: boolean;
}) {
  const router = useRouter();
  const immersed = useUIStore((s) => s.immersed);
  const setImmersed = useUIStore((s) => s.setImmersed);
  const toggleImmersed = useUIStore((s) => s.toggleImmersed);
  const [leaving, setLeaving] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faded = immersed
    ? "pointer-events-none opacity-0"
    : "opacity-100";

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const openPlaylist = (event: React.MouseEvent, href: string, slug: string) => {
    event.preventDefault();
    event.stopPropagation();
    if (leaving) return;
    triggerHaptic();
    setImmersed(true);
    setLeaving(slug);
    leaveTimer.current = setTimeout(() => {
      router.push(href);
    }, LEAVE_DURATION_MS);
  };

  return (
    <main
      onClick={() => {
        if (tapHideEnabled && !leaving) toggleImmersed();
      }}
      className={`relative min-h-dvh overflow-hidden bg-background ${
        tapHideEnabled && !leaving ? "cursor-pointer" : ""
      }`}
    >
      <h1 className="sr-only">Playlists — Yellow White Noise</h1>
      {backdrop && (
        <div aria-hidden className="absolute inset-0">
          <BackdropMedia
            media={backdrop}
            className="h-full w-full bg-cover bg-center"
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-background to-transparent md:h-28"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-background to-transparent md:h-28"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-28 bg-gradient-to-r from-background to-transparent md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 right-0 z-30 hidden w-28 bg-gradient-to-l from-background to-transparent md:block"
      />

      <div
        onClick={(event) => event.stopPropagation()}
        className={`transition-opacity duration-700 ${faded}`}
      >
        <PlaylistAboutToggle />
      </div>
      <div
        data-scroll-strip
        className={`relative z-10 flex h-dvh flex-col overflow-y-auto overflow-x-hidden overscroll-contain transition-opacity duration-700 [overflow-anchor:none] md:flex-row md:items-center md:overflow-x-auto md:overflow-y-hidden ${faded}`}
      >
        <div className="m-auto flex flex-col items-center gap-8 px-6 py-28 md:flex-row md:gap-[2vw] md:px-[2vw] md:py-16">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
            <Link
              key={playlist.slug}
              href={`/playlists/${playlist.slug}`}
              onClick={(event) =>
                openPlaylist(event, `/playlists/${playlist.slug}`, playlist.slug)
              }
              onMouseEnter={() => router.prefetch(`/playlists/${playlist.slug}`)}
              onTouchStart={() => router.prefetch(`/playlists/${playlist.slug}`)}
              aria-busy={leaving === playlist.slug}
              className="group block w-40 md:w-[clamp(150px,16vw,240px)]"
            >
              <div
                className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_25px_50px_-20px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-[1.02]"
                style={{
                  backgroundImage: playlist.coverUrl
                    ? `url(${playlist.coverUrl})`
                    : `linear-gradient(150deg, ${playlist.coverPalette.from}, ${playlist.coverPalette.to})`,
                }}
              >
                <div
                  aria-hidden
                  className="grain absolute inset-0 opacity-25 mix-blend-overlay"
                />
                <span className="absolute inset-0 flex items-center justify-center font-display text-6xl text-white/20">
                  {playlist.name[0]}
                </span>
              </div>
              <h2 className="mt-3 max-w-[70vw] font-display text-sm font-medium uppercase tracking-[0.14em] transition-colors [text-wrap:balance] break-words group-hover:text-yellow md:max-w-none md:text-base">
                {playlist.name}
              </h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-35">
                {playlist.entries.length} tracks
              </p>
            </Link>
            ))
          ) : (
            <p className="px-6 text-center text-[11px] uppercase tracking-[0.2em] opacity-50">
              No playlists are currently published.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
