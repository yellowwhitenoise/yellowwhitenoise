"use client";

import { PlatformIcon } from "@/components/PlatformIcon";
import { trackOutbound } from "@/lib/ads";
import { platformLabels, type Platform } from "@/lib/data";
import { buildOutboundUrl } from "@/lib/utm";

const platforms = Object.keys(platformLabels) as Platform[];

/**
 * Compact individual-playlist hero ("Compact" style in Admin → Settings).
 * Thumbnail + title in one row, streaming icons in a single row, short
 * static description — so tracks and CTAs fit without scrolling.
 */
export function PlaylistCompactHero({
  name,
  tagline,
  description,
  links,
  coverUrl,
  palette,
}: {
  name: string;
  tagline: string;
  description: string;
  links: Partial<Record<Platform, string>>;
  coverUrl?: string;
  palette: { from: string; to: string };
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className="relative h-22 w-22 shrink-0 overflow-hidden rounded-2xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
          style={{
            backgroundImage: coverUrl
              ? `url(${coverUrl})`
              : `linear-gradient(150deg, ${palette.from}, ${palette.to})`,
          }}
        >
          <div
            aria-hidden
            className="grain absolute inset-0 opacity-25 mix-blend-overlay"
          />
          <span className="absolute inset-0 flex items-center justify-center font-display text-4xl text-white/20">
            {name[0]}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] opacity-50">
            YWN · Playlist
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold uppercase leading-tight tracking-[0.08em]">
            {name}
          </h1>
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug opacity-70">
            {tagline}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        {platforms.map((platform) => {
          const href = links[platform];
          if (!href) return null;
          return (
            <a
              key={platform}
              href={buildOutboundUrl(href)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Listen on ${platformLabels[platform]} — ${name}`}
              onClick={(event) => {
                // Don't trigger tap-to-hide when using the streaming icons.
                event.stopPropagation();
                trackOutbound(platformLabels[platform], name);
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground/15 transition-colors hover:border-yellow"
            >
              <PlatformIcon platform={platform} className="h-5 w-5" />
            </a>
          );
        })}
      </div>

      <p className="mt-5 line-clamp-3 border-t border-foreground/10 pt-4 text-[13px] leading-relaxed opacity-70">
        {description}
      </p>
    </div>
  );
}
