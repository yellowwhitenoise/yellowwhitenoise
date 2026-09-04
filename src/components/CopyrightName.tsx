"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true
  );
}

/**
 * The "Yellow White Noise" name in the About page copyright line.
 * Becomes a link to the admin login only when the app is installed
 * (standalone display mode on mobile/desktop) — there is no address
 * bar there, so this is the only way in.
 */
export function CopyrightName() {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(display-mode: standalone)");
    const update = () => setInstalled(isInstalled());
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!installed) return <>Yellow White Noise</>;
  return (
    <Link
      href="/admin/login"
      aria-label="Admin login"
      className="cursor-pointer"
    >
      Yellow White Noise
    </Link>
  );
}
