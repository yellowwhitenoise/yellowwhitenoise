"use client";

import { useEffect, useRef, useState } from "react";
import { trackOutbound } from "@/lib/ads";
import { albumKey, useCatalogStore } from "@/lib/store/catalog";
import { platformLabels, type Album, type Platform } from "@/lib/data";

const platforms: Platform[] = [
  "appleMusic",
  "spotify",
  "amazonMusic",
  "youtubeMusic",
];

export function AlbumList({
  albums,
  artistSlug,
  artistName,
  pinnedTitle,
  onPinChange,
}: {
  albums: Album[];
  artistSlug: string;
  artistName: string;
  /** Controlled pin: which album's platform links are expanded. */
  pinnedTitle: string | null;
  /** Fires on tap-pin changes and outside-tap collapse (never on hover). */
  onPinChange: (title: string | null) => void;
}) {
  const [hoverTitle, setHoverTitle] = useState<string | null>(null);
  const [canHover] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const resolvedMap = useCatalogStore((s) => s.resolved);
  const resolveAlbumAction = useCatalogStore((s) => s.resolveAlbum);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  useEffect(() => {
    if (!pinnedTitle) return;
    const el = itemRefs.current.get(pinnedTitle);
    if (!el) return;
    // Phase 1: bring the tapped album into view right away.
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    // Phase 2: the links expand over a 300ms transition, so a scroll fired
    // immediately lands on the still-collapsed row and the last links end
    // up below the fold. Once expansion finishes, pin the whole links
    // block fully into view above the track strip — no manual scroll needed.
    const timer = setTimeout(() => {
      const links = el.querySelector("[data-album-links]");
      (links ?? el).scrollIntoView({ block: "end", behavior: "smooth" });
    }, 350);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [pinnedTitle]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // Taps on the track strip must not collapse the pin — otherwise
      // playing a filtered album track would snap back to All Tracks.
      if (
        target instanceof HTMLElement &&
        target.closest("[data-track-strip]")
      ) {
        return;
      }
      if (listRef.current && !listRef.current.contains(target)) {
        onPinChange(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onPinChange]);

  const openTitle = pinnedTitle ?? hoverTitle;

  const linkFor = (album: Album, platform: Platform) =>
    resolvedMap[albumKey(artistSlug, album.title)]?.links[platform] ??
    album.links[platform];

  return (
    <ul ref={listRef} className="space-y-1 md:space-y-1">
      {albums.map((album) => {
        const open = openTitle === album.title;
        return (
          <li
            key={album.title}
            ref={(el) => {
              if (el) itemRefs.current.set(album.title, el);
              else itemRefs.current.delete(album.title);
            }}
            className="scroll-mb-24"
            onMouseEnter={
              canHover
                ? () => {
                    setHoverTitle(album.title);
                    void resolveAlbumAction(
                      artistSlug,
                      album.title,
                      artistName,
                    );
                  }
                : undefined
            }
            onMouseLeave={canHover ? () => setHoverTitle(null) : undefined}
          >
            <button
              type="button"
              onClick={() => {
                void resolveAlbumAction(artistSlug, album.title, artistName);
                onPinChange(pinnedTitle === album.title ? null : album.title);
              }}
              aria-expanded={open}
              className="cursor-pointer py-1 text-left text-[12px] transition-colors hover:text-yellow md:text-sm"
            >
              {album.title}
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${
                open
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div data-album-links className="scroll-mb-28 overflow-hidden">
                {platforms.map((platform) => {
                  const href = linkFor(album, platform);
                  if (!href) return null;
                  return (
                    <a
                      key={platform}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackOutbound(platformLabels[platform], album.title)
                      }
                      className="block py-1.5 text-[10px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-yellow"
                    >
                      {platformLabels[platform]}
                    </a>
                  );
                })}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
