"use client";

import { useEffect, useRef, useState } from "react";
import { trackOutbound } from "@/lib/ads";
import {
  isTrackActive,
  usePlaybackStore,
  type PlaybackTrack,
} from "@/lib/store/playback";
import { trackKey, useCatalogStore } from "@/lib/store/catalog";
import { platformLabels, type Platform } from "@/lib/data";

const platforms: Platform[] = ["appleMusic", "spotify", "youtubeMusic"];

export interface PlaylistRow {
  key: string;
  title: string;
  artistName: string;
  artistSlug: string;
  songSlug: string;
  links: Partial<Record<Platform, string>>;
  previewUrl?: string;
  coverUrl?: string;
  palette: { from: string; to: string };
}

export function PlaylistTracks({ rows }: { rows: PlaylistRow[] }) {
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [canHover] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const resolvedMap = useCatalogStore((s) => s.resolved);
  const resolveTrackAction = useCatalogStore((s) => s.resolveTrack);
  const current = usePlaybackStore((s) => s.current);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    for (const row of rows) {
      void resolveTrackAction(
        row.artistSlug,
        row.songSlug,
        row.title,
        row.artistName,
      );
    }
  }, [rows, resolveTrackAction]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setPinnedKey(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const toTrack = (row: PlaylistRow): PlaybackTrack => ({
    artistSlug: row.artistSlug,
    songSlug: row.songSlug,
    title: row.title,
    previewUrl:
      resolvedMap[trackKey(row.artistSlug, row.songSlug)]?.previewUrl ??
      row.previewUrl,
  });

  const handleClick = (row: PlaylistRow, event: React.MouseEvent) => {
    const pointerType = (event.nativeEvent as PointerEvent).pointerType;
    setPinnedKey((current) => (current === row.key ? null : row.key));
    if (pointerType === "touch" || !canHover) {
      usePlaybackStore.getState().toggle(toTrack(row));
    }
  };

  return (
    <ul
      ref={listRef}
      className="flex flex-col divide-y divide-foreground/10"
      onMouseLeave={
        canHover
          ? () => {
              setHoverKey(null);
              usePlaybackStore.getState().stop();
            }
          : undefined
      }
    >
      {rows.map((row, index) => {
        const active = isTrackActive(
          current,
          isPlaying,
          row.artistSlug,
          row.songSlug,
        );
        const hovered = canHover && hoverKey === row.key;
        const expanded = pinnedKey === row.key || active || hovered;
        const resolved = resolvedMap[trackKey(row.artistSlug, row.songSlug)];
        const playable = resolved
          ? Boolean(resolved.previewUrl ?? row.previewUrl)
          : true;
        const artwork =
          resolved?.artworkUrl ??
          row.coverUrl ??
          `linear-gradient(140deg, ${row.palette.from}, ${row.palette.to})`;
        return (
          <li key={row.key}>
            <button
              type="button"
              onMouseEnter={
                canHover
                  ? () => {
                      setHoverKey(row.key);
                      usePlaybackStore.getState().play(toTrack(row));
                    }
                  : undefined
              }
              onClick={(event) => handleClick(row, event)}
              aria-pressed={pinnedKey === row.key}
              aria-expanded={expanded}
              aria-label={`Play preview of ${row.title}`}
              className={`group flex w-full items-center gap-4 py-3 text-left transition-colors ${
                playable ? "cursor-pointer hover:bg-foreground/[0.04]" : "cursor-default"
              }`}
            >
              <span className="w-5 shrink-0 text-center text-[11px] tabular-nums opacity-35">
                {active ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="inline h-3.5 w-3.5 text-yellow"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]"
                style={{
                  backgroundImage: artwork.startsWith("linear-gradient")
                    ? artwork
                    : `url(${artwork})`,
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.title}
                </span>
                <span className="block truncate text-xs opacity-55">
                  {row.artistName}
                </span>
              </span>
              <span className="shrink-0 pr-1 text-[10px] uppercase tracking-[0.16em] opacity-40">
                {playable
                  ? active
                    ? "Playing"
                    : "Play 30s"
                  : "No preview"}
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                expanded
                  ? "mb-3 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex flex-wrap gap-2 pl-9">
                  {platforms.map((platform) => {
                    const href = resolved?.links[platform] ?? row.links[platform];
                    if (!href) return null;
                    return (
                      <a
                        key={platform}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackOutbound(platformLabels[platform], row.title)
                        }
                        className="rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] opacity-70 transition-colors hover:text-yellow"
                      >
                        {platformLabels[platform]}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
