"use client";

import { useState } from "react";
import { PlatformIcon, platformColor } from "@/components/PlatformIcon";
import { trackOutbound } from "@/lib/ads";
import { trackKey, useCatalogStore } from "@/lib/store/catalog";
import {
  platformLabels,
  type ArtistPalette,
  type Platform,
  type Song,
} from "@/lib/data";

const platforms = Object.keys(platformLabels) as Platform[];

interface SongCardProps {
  song: Song;
  index: number;
  palette: ArtistPalette;
  artistSlug: string;
  expanded: boolean;
  onToggle: () => void;
  active: boolean;
  onPlayToggle: () => void;
}

export function SongCard({
  song,
  index,
  palette,
  artistSlug,
  expanded,
  onToggle,
  active,
  onPlayToggle,
}: SongCardProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>("spotify");
  const resolved = useCatalogStore(
    (s) => s.resolved[trackKey(artistSlug, song.slug)],
  );
  const activeLink =
    resolved?.links[activePlatform] ?? song.links[activePlatform];

  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.04] p-3">
      <div className="flex items-center gap-4">
        <div
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
          style={{
            backgroundImage: `linear-gradient(${140 + index * 25}deg, ${palette.from}, ${palette.to})`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="absolute inset-0 m-auto h-6 w-6 text-white/30"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
          </svg>
          <button
            type="button"
            onClick={() => {
              onPlayToggle();
              onToggle();
            }}
            aria-expanded={expanded}
            aria-pressed={active}
            aria-label={
              expanded ? `Collapse ${song.title}` : `Play preview of ${song.title}`
            }
            className="group/play absolute inset-0 flex cursor-pointer items-center justify-center"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-transform duration-300 group-hover/play:scale-110 ${
                active
                  ? "bg-black/70 text-yellow"
                  : "bg-black/55 text-white"
              }`}
            >
              {active ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 translate-x-[1px]"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{song.title}</p>
          <p className="mt-0.5 truncate text-xs opacity-55">
            {song.artistName}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-35">
            {song.releaseYear} · {song.type.replace("-", " ")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2.5 pl-20">
        {platforms.map((platform) => {
          const link = resolved?.links[platform] ?? song.links[platform];
          const icon = (
            <PlatformIcon
              platform={platform}
              className="h-4 w-4"
              style={{ color: platformColor(platform) }}
            />
          );
          return link ? (
            <a
              key={platform}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${platformLabels[platform]} — ${song.title}`}
              onClick={() => trackOutbound(platformLabels[platform], song.title)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 transition-colors hover:bg-foreground/10"
            >
              {icon}
            </a>
          ) : (
            <span
              key={platform}
              aria-disabled
              className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 opacity-30"
            >
              {icon}
            </span>
          );
        })}
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          expanded
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-20 flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActivePlatform(platform)}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    activePlatform === platform
                      ? "bg-foreground text-background"
                      : "border border-foreground/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  {platformLabels[platform]}
                </button>
              ))}
            </div>
            {song.previewUrl ? (
              <audio
                controls
                preload="none"
                src={song.previewUrl}
                className="h-9 w-full"
              />
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-foreground/[0.06] px-3 py-2.5">
                <span className="text-[10px] uppercase tracking-[0.18em] opacity-50">
                  30s preview coming soon
                </span>
                {activeLink && (
                  <a
                    href={activeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-[0.18em] underline underline-offset-4 opacity-70 transition-opacity hover:opacity-100"
                  >
                    Open on {platformLabels[activePlatform]}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
