"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { triggerHaptic } from "@/lib/haptics";
import { useUIStore } from "@/lib/store/ui";

const links = [
  { href: "/", label: "Home" },
  { href: "/playlists", label: "Playlists" },
  { href: "/about", label: "About" },
];

const ABOUT_GROUP = ["/about", "/contact", "/blog", "/privacy"];

export function BottomNav() {
  const pathname = usePathname();
  const chromeHidden = useUIStore((s) => s.chromeHidden);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/about") {
      return ABOUT_GROUP.some((path) => pathname.startsWith(path));
    }
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
      className={`fixed inset-x-0 bottom-0 z-40 text-white transition-all duration-300 ${
        chromeHidden ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
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
