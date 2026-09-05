"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { useUIStore } from "@/lib/store/ui";

export function SiteLogo() {
  const chromeHidden = useUIStore((s) => s.chromeHidden);
  const immersed = useUIStore((s) => s.immersed);
  const hidden = chromeHidden || immersed;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 flex flex-col items-center pt-[max(env(safe-area-inset-top),1.25rem)] text-white transition-all duration-300 ${
        hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
      inert={hidden}
      aria-hidden={hidden}
    >
      <Link
        href="/"
        aria-label="Yellow White Noise — Home"
        className="pointer-events-auto"
      >
        <Wordmark />
      </Link>
    </div>
  );
}
