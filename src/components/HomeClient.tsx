"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { BackdropMedia } from "@/components/BackdropMedia";
import type { Artist, MediaRef } from "@/lib/data";
import { useArtistsStore } from "@/lib/store/artists";
import { useUIStore } from "@/lib/store/ui";

const COPIES = [0, 1, 2];
const LOOP_THRESHOLD = 4;

export default function HomeClient({
  artists,
  backdrop,
  initialSheet,
}: {
  artists: Artist[];
  backdrop?: MediaRef;
  initialSheet?: string;
}) {
  const immersed = useUIStore((s) => s.immersed);
  const toggleImmersed = useUIStore((s) => s.toggleImmersed);
  const hoveredSlug = useUIStore((s) => s.hoveredArtistSlug);
  const setHoveredArtist = useUIStore((s) => s.setHoveredArtist);
  const openSheet = useUIStore((s) => s.openSheet);
  const sheetSlug = useUIStore((s) => s.sheetArtistSlug);
  const setStoreArtists = useArtistsStore((s) => s.setArtists);
  const pathname = usePathname();

  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setStoreArtists(artists));
    return () => cancelAnimationFrame(raf);
  }, [artists, setStoreArtists]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (initialSheet) openSheet(initialSheet);
      setSynced(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [initialSheet, openSheet]);

  useEffect(() => {
    if (!synced) return;
    const onArtistPath = artists.some(
      (artist) => `/${artist.slug}` === pathname,
    );
    if (sheetSlug) {
      if (pathname !== `/${sheetSlug}`) {
        window.history.replaceState(null, "", `/${sheetSlug}`);
      }
    } else if (onArtistPath) {
      window.history.replaceState(null, "", "/");
    }
  }, [sheetSlug, synced, pathname, artists]);

  const loopEnabled = artists.length >= LOOP_THRESHOLD;
  const copies = loopEnabled ? COPIES : [0];

  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copySize = useRef(0);
  const scrollingRef = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrolling, setScrolling] = useState(false);

  const isHorizontal = () =>
    window.matchMedia("(min-width: 768px)").matches;

  const measure = useCallback(() => {
    const first = groupRefs.current[0];
    const second = groupRefs.current[1];
    if (!first || !second) return;
    const a = first.getBoundingClientRect();
    const b = second.getBoundingClientRect();
    copySize.current = isHorizontal() ? b.left - a.left : b.top - a.top;
  }, []);

  const normalize = useCallback(() => {
    const el = scrollerRef.current;
    const size = copySize.current;
    if (!el || size <= 0) return;
    if (isHorizontal()) {
      while (el.scrollLeft >= size * 1.5) el.scrollLeft -= size;
      while (el.scrollLeft < size * 0.5) el.scrollLeft += size;
    } else {
      while (el.scrollTop >= size * 1.5) el.scrollTop -= size;
      while (el.scrollTop < size * 0.5) el.scrollTop += size;
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !loopEnabled) return;
    measure();
    const firstCircle = groupRefs.current[1]?.querySelector("button");
    if (firstCircle && copySize.current > 0) {
      const elRect = el.getBoundingClientRect();
      const circleRect = firstCircle.getBoundingClientRect();
      if (isHorizontal()) {
        el.scrollLeft +=
          circleRect.left +
          circleRect.width / 2 -
          (elRect.left + elRect.width / 2);
      } else {
        el.scrollTop +=
          circleRect.top +
          circleRect.height / 2 -
          (elRect.top + elRect.height / 2);
      }
    }
    normalize();
    const onResize = () => {
      measure();
      normalize();
    };
    window.addEventListener("resize", onResize);
    document.fonts.ready.then(() => {
      measure();
      normalize();
    });
    return () => {
      window.removeEventListener("resize", onResize);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [measure, normalize, loopEnabled]);

  useEffect(() => {
    const onScrollTop = () => {
      scrollerRef.current?.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    };
    window.addEventListener("ywn:scroll-to-top", onScrollTop);
    return () => window.removeEventListener("ywn:scroll-to-top", onScrollTop);
  }, []);

  const onScroll = () => {
    normalize();
    scrollingRef.current = true;
    setScrolling(true);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      scrollingRef.current = false;
      setScrolling(false);
    }, 160);
  };

  const handleArtistEnter = (slug: string) => {
    if (!scrollingRef.current) setHoveredArtist(slug);
  };

  return (
    <main
      onClick={() => toggleImmersed()}
      className="relative flex min-h-dvh cursor-pointer flex-col overflow-hidden"
    >
      <h1 className="sr-only">
        Yellow White Noise — Independent Amapiano &amp; Afrobeats Label
      </h1>
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_115%,#8a6a3f_0%,#4a3f33_32%,#23262e_66%,#101318_100%)]" />
        {backdrop && (
          <BackdropMedia
            media={backdrop}
            className="absolute inset-0 bg-cover bg-center"
          />
        )}
        {backdrop && (
          <div className="absolute inset-0 bg-background/70" />
        )}
        {artists.map(({ slug, palette, hoverMedia, hoverBackdropEnabled }) =>
          hoverBackdropEnabled === false ? null : (
            <BackdropMedia
              key={slug}
              media={hoverMedia}
              from={palette.from}
              to={palette.to}
              className={`absolute inset-0 transition-opacity duration-700 ${
                hoveredSlug === slug ? "opacity-100" : "opacity-0"
              }`}
            />
          ),
        )}
        {artists.map(({ slug, hoverBackdropEnabled }) =>
          hoverBackdropEnabled === false ? null : (
            <div
              key={`dim-${slug}`}
              className={`absolute inset-0 bg-background/70 transition-opacity duration-700 ${
                hoveredSlug === slug ? "opacity-100" : "opacity-0"
              }`}
            />
          ),
        )}
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_78%_16%,rgba(240,180,41,0.14),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/75 to-transparent md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/75 to-transparent md:hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-28 bg-gradient-to-r from-black/75 to-transparent md:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden w-28 bg-gradient-to-l from-black/75 to-transparent md:block"
      />

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        data-scrolling={scrolling}
        className="relative z-10 flex h-dvh flex-col overflow-y-auto overflow-x-hidden overscroll-contain [overflow-anchor:none] md:flex-row md:items-center md:overflow-x-auto md:overflow-y-hidden"
      >
        {copies.map((copy) => (
          <div
            key={copy}
            ref={(node) => {
              groupRefs.current[copy] = node;
            }}
            className={`m-auto flex flex-col items-center gap-14 px-7 py-7 transition-opacity duration-700 md:flex-row md:gap-[4vw] md:px-[5vw] md:py-7 ${
              immersed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            {artists.map(({ slug, name, genre, palette, homeImage }, index) => (
              <button
                key={slug}
                type="button"
                aria-label={`${name} — ${genre}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet(slug);
                }}
                onMouseEnter={() => handleArtistEnter(slug)}
                onMouseLeave={() => setHoveredArtist(null)}
                className="group flex cursor-pointer flex-col items-center gap-5 focus-visible:outline-none"
              >
                <span
                  className={`flex h-44 w-44 items-center justify-center overflow-hidden rounded-full bg-cover bg-center ring-1 ring-white/25 shadow-[0_35px_70px_-25px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover:scale-[1.04] group-focus-visible:ring-2 group-focus-visible:ring-yellow md:size-[clamp(200px,22vw,320px)]`}
                  style={
                    homeImage
                      ? { backgroundImage: `url(${homeImage})` }
                      : {
                          backgroundImage: `linear-gradient(${150 + index * 30}deg, ${palette.from}, ${palette.to})`,
                        }
                  }
                >
                  {!homeImage && (
                    <span className="font-display text-7xl text-white/20">
                      {name[0]}
                    </span>
                  )}
                </span>
                <span className="flex flex-col items-center gap-1.5">
                  <span className="font-display text-sm font-medium uppercase tracking-[0.32em] text-white/90">
                    {name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                    {genre}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
