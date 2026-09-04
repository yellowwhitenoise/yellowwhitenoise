"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { useUIStore } from "@/lib/store/ui";

export function SiteLogo() {
  const chromeHidden = useUIStore((s) => s.chromeHidden);

  return (
    <Link
      href="/"
      aria-label="Yellow White Noise — Home"
      className={`fixed inset-x-0 top-0 z-40 flex flex-col items-center pt-5 text-white transition-all duration-300 ${
        chromeHidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <Wordmark />
    </Link>
  );
}
