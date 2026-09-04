"use client";

import { useEffect } from "react";
import { initAds } from "@/lib/ads";
import { useConsentStore } from "@/lib/store/consent";

export function AdsInit() {
  const status = useConsentStore((s) => s.status);
  const hydrated = useConsentStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && status === "accepted") initAds();
  }, [hydrated, status]);

  return null;
}
