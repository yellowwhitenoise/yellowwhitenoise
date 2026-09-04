"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/playlists", label: "Playlists" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/email", label: "Email" },
  { href: "/admin/advertising", label: "Advertising" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
    }
    setOpen(false);
    router.push("/admin/login");
    router.refresh();
  };

  // Close drawer on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open ]);

  // Lock body scroll when the mobile overlay drawer is open
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open ]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      // Only treat mostly-horizontal swipes as drawer gestures
      if (Math.abs(dy) > Math.abs(dx) * 0.6) return;
      if (Math.abs(dx) < 60) return;
      if (dx > 0) {
        // Swipe right: open when starting near the left edge
        if (!open && start.x < 48) setOpen(true);
      } else {
        // Swipe left: close when open
        if (open) setOpen(false);
      }
    },
    [open ],
  );

  if (pathname === "/admin/login") return <>{children}</>;

  const closeOnMobile = () => {
    if (window.matchMedia("(max-width: 767px)").matches) setOpen(false);
  };

  return (
    <div
      className="min-h-dvh bg-background text-foreground"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar: hamburger left, title center, view-site right */}
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/95 backdrop-blur">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close admin menu" : "Open admin menu"}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-foreground/15 transition-colors hover:bg-foreground/10"
          >
            {open ? (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
          <Link
            href="/admin"
            className="justify-self-center font-display text-[11px] font-semibold uppercase tracking-[0.3em]"
          >
            WN Admin
          </Link>
          <Link
            href="/"
            target="_blank"
            className="justify-self-end text-[11px] uppercase tracking-[0.16em] opacity-60 transition-opacity hover:opacity-100"
          >
            View site ↗
          </Link>
        </div>
      </header>

      <div className="relative">
        {/* Mobile scrim (drawer overlays, half-width) */}
        <div
          onClick={() => setOpen(false)}
          aria-hidden={!open}
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        {/* Drawer: slides in from the left */}
        <aside
          aria-label="Admin navigation"
          aria-hidden={!open}
          className={`fixed top-0 bottom-0 left-0 z-50 flex w-[50vw] min-w-[220px] max-w-[280px] flex-col border-r border-foreground/10 bg-background transition-transform duration-300 ease-out md:w-[280px] md:max-w-[280px] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.3em]">
              YWN
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-foreground/15 hover:bg-foreground/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeOnMobile}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                      isActive(pathname, item.href)
                        ? "bg-foreground/10 text-yellow"
                        : "opacity-70 hover:bg-foreground/5 hover:opacity-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-foreground/10 p-4">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="w-full cursor-pointer rounded-lg border border-foreground/15 px-3 py-2.5 text-[11px] uppercase tracking-[0.16em] opacity-70 transition-colors hover:bg-foreground/5 hover:opacity-100 disabled:opacity-40"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] opacity-40">
              Swipe right to open · left to close
            </p>
          </div>
        </aside>

        {/* Page content: overlays on mobile, shifts right on desktop */}
        <div
          className={`transition-[padding] duration-300 ease-out ${
            open ? "md:pl-[280px]" : "md:pl-0"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Backwards-compatible export for anything still importing AdminNav
export function AdminNav() {
  return null;
}
