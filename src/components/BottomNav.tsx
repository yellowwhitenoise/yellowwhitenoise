"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";
import { useUIStore } from "@/lib/store/ui";
import {
  INFO_NAV_META,
  infoSectionFromPath,
  useInfoNavStore,
} from "@/lib/store/infoNav";

const ABOUT_GROUP = ["/about", "/contact", "/blog", "/privacy"];

export function BottomNav() {
  const pathname = usePathname();
  const chromeHidden = useUIStore((s) => s.chromeHidden);
  const immersed = useUIStore((s) => s.immersed);
  const hidden = chromeHidden || immersed;
  const storedSection = useInfoNavStore((s) => s.section);
  const infoNavTouched = useInfoNavStore((s) => s.touched);
  const resetInfoNav = useInfoNavStore((s) => s.reset);

  const inGroup = ABOUT_GROUP.some((path) => pathname.startsWith(path));

  // Leaving the About group resets the third item back to About.
  useEffect(() => {
    if (!inGroup) resetInfoNav();
  }, [inGroup, resetInfoNav]);

  // While inside the group the store (updated instantly on in-page tab
  // switches) wins; otherwise fall back to the pathname so direct loads
  // render the right label on the first paint. Outside the group it is
  // always About.
  const effectiveSection = inGroup
    ? infoNavTouched
      ? storedSection
      : infoSectionFromPath(pathname)
    : "about";
  const infoMeta = INFO_NAV_META[effectiveSection];

  const links = [
    { href: "/", label: "Home" },
    { href: "/playlists", label: "Playlists" },
    { href: infoMeta.href, label: infoMeta.label },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === infoMeta.href && inGroup) return true;
    return pathname.startsWith(href);
  };

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    triggerHaptic();
    if (!isActive(href)) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("ywn:scroll-to-top"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      inert={hidden}
      className={`fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white transition-all duration-300 ${
        hidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <ul className="flex items-center justify-center gap-7 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] text-[13px] uppercase tracking-[0.18em]">
        {links.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => handleNavClick(event, href)}
                className={`transition-opacity duration-300 hover:opacity-100 ${
                  active ? "opacity-100" : "opacity-50"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
