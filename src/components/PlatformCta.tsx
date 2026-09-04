"use client";

import { PlatformIcon } from "@/components/PlatformIcon";
import { trackOutbound } from "@/lib/ads";
import { platformLabels, type Platform } from "@/lib/data";
import { buildOutboundUrl } from "@/lib/utm";

export function PlatformCta({
  platform,
  href,
  entity,
  compact,
}: {
  platform: Platform;
  href: string;
  entity: string;
  compact?: boolean;
}) {
  return (
    <a
      href={buildOutboundUrl(href)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutbound(platformLabels[platform], entity)}
      className={`flex items-center border border-foreground/10 transition-colors hover:bg-foreground/[0.06] ${
        compact
          ? "justify-start gap-2.5 rounded-xl px-3 py-2"
          : "justify-center gap-3 rounded-2xl px-4 py-4"
      }`}
    >
      <PlatformIcon
        platform={platform}
        className={`${compact ? "h-4 w-4" : "h-6 w-6"} shrink-0 text-foreground`}
      />
      <span
        className={`font-medium uppercase ${
          compact
            ? "text-[10px] tracking-[0.14em]"
            : "text-[12px] tracking-[0.16em]"
        }`}
      >
        Listen on {platformLabels[platform]}
      </span>
    </a>
  );
}
