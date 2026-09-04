"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/content", label: "Content" },
    { href: "/admin/media", label: "Media" },
    { href: "/admin/playlists", label: "Playlists" },
    { href: "/admin/subscribers", label: "Subscribers" },
    { href: "/admin/email", label: "Email" },
    { href: "/admin/advertising", label: "Advertising" },
  ];

  return (
    <nav className="overflow-hidden border-b border-foreground/10">
      <div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-4">
        <Link
          href="/admin"
          className="shrink-0 font-display text-[11px] font-semibold uppercase tracking-[0.3em]"
        >
          YWN · Admin
        </Link>
        <div
          aria-label="Admin navigation"
          className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max shrink-0 items-center gap-5 md:ml-auto md:w-auto md:justify-end">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
                  (item.href === "/admin" && pathname === "/admin")
                    ? "text-yellow"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              target="_blank"
              className="shrink-0 text-[11px] uppercase tracking-[0.16em] opacity-40 transition-opacity hover:opacity-100"
            >
              View site ↗
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
