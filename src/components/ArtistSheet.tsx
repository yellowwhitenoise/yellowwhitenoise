"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { AlbumList } from "@/components/AlbumList";
import { ImageLightbox } from "@/components/ImageLightbox";
import { PlatformIcon } from "@/components/PlatformIcon";
import { TrackGrid } from "@/components/TrackGrid";
import { platformLabels, type Platform } from "@/lib/data";
import { useArtistsStore } from "@/lib/store/artists";
import { useUIStore } from "@/lib/store/ui";

const platforms = Object.keys(platformLabels) as Platform[];

export function ArtistSheet() {
  const sheetSlug = useUIStore((s) => s.sheetArtistSlug);
  const closeSheet = useUIStore((s) => s.closeSheet);
  const open = sheetSlug !== null;
  const artists = useArtistsStore((s) => s.artists);
  const ensureLoaded = useArtistsStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const [mounted, setMounted] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [portraitExpanded, setPortraitExpanded] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(raf);
    }
    const timer = setTimeout(() => {
      setMounted(false);
      setPullY(0);
    }, 320);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeSheet]);

  const artist = artists.find((entry) => entry.slug === sheetSlug);

  if (!mounted || !artist) return null;

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    startY.current = event.touches[0].clientY;
  };

  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta < 0) setPullY(delta);
  };

  const onTouchEnd = () => {
    if (pullY < -90) closeSheet();
    else setPullY(0);
    startY.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={artist.name}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        onClick={closeSheet}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 flex h-dvh flex-col" onClick={closeSheet}>
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={(event) => event.stopPropagation()}
          style={
            pullY !== 0
              ? { transform: `translateY(${pullY}px)`, transition: "none" }
              : undefined
          }
          className={`relative flex min-h-0 flex-1 flex-col justify-start overflow-y-auto bg-background shadow-2xl transition-[translate] duration-300 ease-out md:justify-center ${
            open ? "sheet-in" : "-translate-y-[110%]"
          }`}
        >
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-foreground/15 transition-colors hover:bg-foreground/10 md:top-6 md:right-8"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="w-full scroll-smooth px-5 pt-4 pb-12 md:px-10 md:py-6">
            <div className="md:grid md:grid-cols-[190px_minmax(0,1fr)_200px] md:items-center md:gap-10">
              <div className="flex flex-col">
                <h2 className="font-display text-xl font-semibold uppercase tracking-[0.1em]">
                  {artist.name}
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-[0.28em] opacity-45">
                  {artist.genre}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (artist.pageImage) setPortraitExpanded(true);
                  }}
                  aria-label={
                    artist.pageImage
                      ? `Expand ${artist.name} profile image`
                      : `${artist.name} profile image`
                  }
                  className="relative mt-8 aspect-[4/5] w-full max-w-[210px] cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-left md:mt-14"
                  style={{
                    backgroundImage: `linear-gradient(160deg, ${artist.palette.from}, ${artist.palette.to})`,
                  }}
                >
                  {artist.pageImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artist.pageImage}
                      alt={`${artist.name} profile`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <div
                    aria-hidden
                    className="grain absolute inset-0 opacity-25 mix-blend-overlay"
                  />
                  {!artist.pageImage && (
                    <span className="absolute inset-0 flex items-center justify-center font-display text-7xl text-white/20">
                      {artist.name[0]}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-8 max-w-[52ch] md:mt-0">
                <div className="space-y-3 text-[13px] leading-relaxed opacity-80 md:text-[14px]">
                  {artist.longBio.split("\n\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-6 flex gap-3 md:mt-8">
                  {platforms.map((platform) => (
                    <a
                      key={platform}
                      href={artist.profileLinks[platform]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${platformLabels[platform]} — ${artist.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 transition-colors hover:border-yellow"
                    >
                      <PlatformIcon
                        platform={platform}
                        className="h-4.5 w-4.5 text-foreground"
                      />
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-4 md:mt-0">
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-50 md:text-[11px]">
                  Albums
                </p>
                <div className="mt-1.5 md:mt-2">
                  <AlbumList
                    albums={artist.albums}
                    artistSlug={artist.slug}
                    artistName={artist.name}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-10 shrink-0 border-t border-foreground/10 bg-background/95 backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <TrackGrid
            songs={artist.songs}
            palette={artist.palette}
            artistSlug={artist.slug}
          />
        </div>
      </div>
      {portraitExpanded && artist.pageImage && (
        <ImageLightbox
          src={artist.pageImage}
          alt={`${artist.name} profile`}
          onClose={() => setPortraitExpanded(false)}
        />
      )}
    </div>
  );
}
