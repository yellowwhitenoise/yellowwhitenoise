"use client";

import { useEffect, useState } from "react";

interface Creative {
  creativeType: "html" | "image";
  creativeHtml?: string;
  imageUrl?: string;
  linkUrl?: string;
  alt?: string;
}

export function AdSlot({
  slot,
  category,
  tags,
  className,
}: {
  slot: string;
  category?: string;
  tags?: string[];
  className?: string;
}) {
  const [creative, setCreative] = useState<Creative | null>(null);

  useEffect(() => {
    let visits = 0;
    try {
      visits = Number(localStorage.getItem("ywn-visits") ?? "0") + 1;
      localStorage.setItem("ywn-visits", String(visits));
    } catch {
      visits = 1;
    }
    const device = window.matchMedia("(max-width: 767px)").matches
      ? "mobile"
      : "desktop";
    fetch("/api/ads/serve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot,
        category,
        tags,
        device,
        visitorType: visits > 1 ? "returning" : "new",
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { creative?: Creative } | null) => {
        if (data?.creative) setCreative(data.creative);
      })
      .catch(() => {});
  }, [slot, category, tags]);

  if (!creative) return null;

  return (
    <div
      className={`my-8 overflow-hidden rounded-2xl border border-foreground/10 ${className ?? ""}`}
      data-ad-slot={slot}
    >
      <p className="px-4 pt-3 text-[9px] uppercase tracking-[0.24em] opacity-35">
        Advertisement
      </p>
      {creative.creativeType === "html" && creative.creativeHtml ? (
        <div
          className="px-4 pb-4"
          dangerouslySetInnerHTML={{ __html: creative.creativeHtml }}
        />
      ) : creative.imageUrl ? (
        <a
          href={creative.linkUrl || "#"}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl}
            alt={creative.alt ?? "Advertisement"}
            className="w-full rounded-xl object-cover"
          />
        </a>
      ) : null}
    </div>
  );
}
