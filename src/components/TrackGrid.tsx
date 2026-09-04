"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { trackOutbound } from "@/lib/ads";
import {
  isTrackActive,
  usePlaybackStore,
  type PlaybackTrack,
} from "@/lib/store/playback";
import {
  trackKey,
  useCatalogStore,
} from "@/lib/store/catalog";
import {
  platformLabels,
  type ArtistPalette,
  type Platform,
  type Song,
} from "@/lib/data";

const platforms: Platform[] = ["appleMusic", "spotify", "youtubeMusic"];

export function TrackGrid({
  songs,
  palette,
  artistSlug,
}: {
  songs: Song[];
  palette: ArtistPalette;
  artistSlug: string;
}) {
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null);
  const [canHover] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const current = usePlaybackStore((s) => s.current);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const resolvedMap = useCatalogStore((s) => s.resolved);
  const resolveTrackAction = useCatalogStore((s) => s.resolveTrack);  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setPinnedSlug(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const resolvedFor = (song: Song) => resolvedMap[trackKey(artistSlug, song.slug)];

  const ensureResolved = (song: Song) => {
    void resolveTrackAction(artistSlug, song.slug, song.title, song.artistName);
  };

  const toTrack = (song: Song): PlaybackTrack => ({
    artistSlug,
    songSlug: song.slug,
    title: song.title,
    previewUrl: resolvedFor(song)?.previewUrl ?? song.previewUrl,
  });

  const linkFor = (song: Song, platform: Platform) =>
    resolvedFor(song)?.links[platform] ?? song.links[platform];

  const artworkFor = (song: Song, index: number) =>
    resolvedFor(song)?.artworkUrl ??
    song.coverUrl ??
    `linear-gradient(${140 + index * 25}deg, ${palette.from}, ${palette.to})`;

  const activate = (song: Song) => {
    ensureResolved(song);
    usePlaybackStore.getState().play(toTrack(song));
  };

  const deactivate = () => usePlaybackStore.getState().stop();

  const togglePlay = (song: Song) =>
    usePlaybackStore.getState().toggle(toTrack(song));

  const handleClick = (song: Song, event: MouseEvent) => {
    const pointerType = (event.nativeEvent as PointerEvent).pointerType;
    ensureResolved(song);
    setPinnedSlug((current) => (current === song.slug ? null : song.slug));
    if (pointerType === "touch") togglePlay(song);
  };

  return (
    <div
      ref={rootRef}
      className="w-full"
      onMouseLeave={canHover ? deactivate : undefined}
    >
      <ul className="flex snap-x items-end gap-0.5 overflow-x-auto pb-2">
        {songs.map((song, index) => {
          const isActive = isTrackActive(
            current,
            isPlaying,
            artistSlug,
            song.slug,
          );
          const expanded = pinnedSlug === song.slug || isActive;
          const artwork = artworkFor(song, index);
          return (
            <li key={song.slug} className="flex-none snap-start">
              <div
                className={`grid transition-all duration-300 ease-out ${
                  expanded
                    ? "mb-2 grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  {platforms.map((platform) => (
                    <a
                      key={platform}
                      href={linkFor(song, platform)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackOutbound(platformLabels[platform], song.title)
                      }
                      className="block px-0.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] whitespace-nowrap text-white/85 transition-colors hover:text-yellow"
                    >
                      {platformLabels[platform]}
                    </a>
                  ))}
                </div>
              </div>
              <div
                onMouseEnter={
                  canHover ? () => activate(song) : undefined
                }
                className={`relative aspect-square h-[15dvh] overflow-hidden bg-cover bg-center transition-[filter] duration-300 md:h-[17dvh] ${
                  isActive ? "brightness-125" : "brightness-100"
                }`}
                style={{
                  backgroundImage: artwork.startsWith("linear-gradient")
                    ? artwork
                    : `url(${artwork})`,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="absolute inset-0 m-auto h-7 w-7 text-white/25"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 pt-6">
                  <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-white">
                    {song.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => handleClick(song, event)}
                  aria-pressed={pinnedSlug === song.slug}
                  aria-expanded={expanded}
                  aria-label={`Play ${song.title}`}
                  className="group absolute inset-0 flex cursor-pointer touch-manipulation items-center justify-center"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300 group-hover:scale-110 ${
                      isActive
                        ? "border-yellow bg-black/60 text-yellow"
                        : "border-white/25 bg-black/45 text-white"
                    }`}
                  >
                    {isActive ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4 translate-x-[1px]"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
