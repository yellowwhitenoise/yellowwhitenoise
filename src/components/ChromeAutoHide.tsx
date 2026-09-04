"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/lib/store/ui";

const ENABLED_PREFIXES = [
  "/",
  "/playlists",
  "/about",
  "/blog",
  "/contact",
  "/privacy",
];

export function ChromeAutoHide() {
  const pathname = usePathname();

  useEffect(() => {
    const enabled = ENABLED_PREFIXES.some((prefix) =>
      prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
    );
    if (!enabled) return;

    let lastY = 0;
    const readY = (target: EventTarget | null) => {
      if (target instanceof HTMLElement) return target.scrollTop;
      return window.scrollY;
    };

    lastY = readY(null);
    useUIStore.getState().setChromeHidden(false);

    const onScroll = (event: Event) => {
      const y = readY(event.target);
      const delta = y - lastY;
      lastY = y;
      if (Math.abs(delta) < 4) return;
      useUIStore
        .getState()
        .setChromeHidden(delta > 0 && y > 60);
    };

    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      useUIStore.getState().setChromeHidden(false);
    };
  }, [pathname]);

  return null;
}
