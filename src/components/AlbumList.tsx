"use client";

import { useEffect, useRef, useState } from "react";
import { trackOutbound } from "@/lib/ads";
import { albumKey, useCatalogStore } from "@/lib/store/catalog";
import { platformLabels, type Album, type Platform } from "@/lib/data";

const platforms: Platform[] = ["appleMusic", "spotify", "youtubeMusic"];

export function AlbumList({
  albums,
  artistSlug,
  artistName,
}: {
  albums: Album[];
  artistSlug: string;
  artistName: string;
}) {
  const [pinnedTitle, setPinnedTitle] = useState<string | null>(null);
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
    if (pinnedTitle) {
      const el = itemRefs.current.get(pinnedTitle);
      // Ensure the expanded streaming links scroll into view above the
      // fixed track strip at the bottom of the artist sheet (mobile).
      requestAnimationFrame(() => {
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
    }
  }, [pinnedTitle]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (listRef.current && !listRef.current.contains(event.target as Node)) {
        setPinnedTitle(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

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
                setPinnedTitle((current) =>
                  current === album.title ? null : album.title,
                );
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
              <div className="overflow-hidden">
                {platforms.map((platform) => (
                  <a
                    key={platform}
                    href={linkFor(album, platform)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackOutbound(platformLabels[platform], album.title)
                    }
                    className="block py-1.5 text-[10px] uppercase tracking-[0.16em] text-foreground/70 transition-colors hover:text-yellow"
                  >
                    {platformLabels[platform]}
                  </a>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
