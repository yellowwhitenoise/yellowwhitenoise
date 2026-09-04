"use client";

import { useEffect, useState } from "react";
import { useConsentStore } from "@/lib/store/consent";

export function CookieConsent() {
  const status = useConsentStore((s) => s.status);
  const hydrated = useConsentStore((s) => s.hydrated);
  const hydrate = useConsentStore((s) => s.hydrate);
  const accept = useConsentStore((s) => s.accept);
  const decline = useConsentStore((s) => s.decline);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && status === "unknown") {
      const timer = setTimeout(() => setReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [hydrated, status]);

  if (!ready || status !== "unknown") return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-24 z-[60] sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[340px]"
    >
      <div className="rise-in rounded-2xl border border-foreground/10 bg-background p-5 shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.22em] opacity-50">
          Cookies
        </p>
        <p className="mt-2 text-[13px] leading-relaxed opacity-75">
          We use cookies to measure how the site performs and to make our
          marketing more relevant. You can accept or decline — the site works
          either way.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={accept}
            className="flex-1 cursor-pointer rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={decline}
            className="flex-1 cursor-pointer rounded-full border border-foreground/20 px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
