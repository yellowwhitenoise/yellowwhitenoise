"use client";

import { useState } from "react";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";

type ShareIconName =
  | "share"
  | "link"
  | "messages"
  | "x"
  | "facebook"
  | "whatsapp"
  | "linkedin"
  | "threads"
  | "pinterest"
  | "telegram"
  | "instagram";

function ShareIcon({ name }: { name: ShareIconName }) {
  if (name === "link") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M9.5 14.5 14.5 9.5" />
        <path d="M7.2 17.8 5.7 19.3a3.25 3.25 0 0 1-4.6-4.6l3.2-3.2a3.25 3.25 0 0 1 4.6 0" />
        <path d="m16.8 6.2 1.5-1.5a3.25 3.25 0 0 1 4.6 4.6l-3.2 3.2a3.25 3.25 0 0 1-4.6 0" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="m5 4 14 16M19 4 5 20" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M14.5 8H17V4h-2.5C11.18 4 9 6.08 9 9.43V12H6v4h3v8h4v-8h3.2l.8-4H13V9.5c0-.99.45-1.5 1.5-1.5Z" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.2A9.5 9.5 0 1 0 12 2.5Z" />
        <path d="M8.7 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.6.7c.5 1 1.3 1.8 2.4 2.3l.7-.6c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.6 0 .8-.4 1.5-1 1.8-.5.3-1.2.3-2 .1-2.9-.8-5.8-3.6-6.6-6.5-.2-.8-.2-1.5.1-2 .3-.5.8-.9 1.2-1.2Z" />
      </svg>
    );
  }
  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M5.2 8.2A2.2 2.2 0 1 0 5.2 3.8a2.2 2.2 0 0 0 0 4.4ZM3.3 20h3.8V9.7H3.3V20Zm6.1 0h3.8v-5.6c0-1.5.3-3 2.2-3 1.8 0 1.8 1.7 1.8 3.1V20H21v-6.2c0-3.1-.7-5.5-4.6-5.5-1.9 0-3.1 1-3.6 1.9h-.1V9.7H9.4V20Z" />
      </svg>
    );
  }
  if (name === "share") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
      </svg>
    );
  }
  if (name === "messages") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L4 20.5v-15Z" />
        <path d="M8 10.5h8M8 13h5" />
      </svg>
    );
  }
  if (name === "telegram") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M21 4.5 3.5 11.5l7 2.5 2.5 7 4.5-6.5 3.5-10Z" />
        <path d="m10.5 14 10.5-9.5" />
      </svg>
    );
  }
  if (name === "threads") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <text x="12" y="17.5" textAnchor="middle" fontSize="15" fontWeight="600">@</text>
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
      <text x="12" y="17.5" textAnchor="middle" fontSize="14" fontWeight="700">P</text>
    </svg>
  );
}

const shareItems: {
  name: ShareIconName;
  label: string;
}[] = [
  { name: "share", label: "Share via…" },
  { name: "link", label: "Copy link" },
  { name: "x", label: "X" },
  { name: "facebook", label: "Feed" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "linkedin", label: "LinkedIn" },
  { name: "messages", label: "Messages" },
  { name: "threads", label: "Threads" },
  { name: "pinterest", label: "Pinterest" },
  { name: "telegram", label: "Telegram" },
  { name: "instagram", label: "Instagram" },
];

/**
 * "Share" trigger opening the share tiles in a bottom sheet on mobile
 * and a dropdown on desktop.
 */
export function ShareMenu({
  entityName,
  text,
  label = "Share",
  align = "right",
  buttonClassName,
  menuClassName = "w-[min(90vw,24rem)]",
}: {
  entityName: string;
  text?: string;
  label?: string;
  align?: "left" | "right";
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const message = text ?? `Check out ${entityName} on Yellow White Noise`;
  const shareUrl = () => encodeURIComponent(window.location.href);
  const shareText = () => encodeURIComponent(message);

  const shareVia = async () => {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: entityName, text: message, url });
      } catch {
        // Share sheet dismissed — stay silent.
      }
    } else {
      await copyLink();
    }
  };

  return (
    <ResponsiveMenu
      label={label}
      activeLabel={copied ? "Link copied" : undefined}
      buttonClassName={buttonClassName}
      align={align}
      menuClassName={menuClassName}
    >
      {(close) => (
        <div className="overflow-hidden py-2">
          <div className="flex gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shareItems.map((item) => {
              const tileClass =
                "flex w-20 shrink-0 flex-col items-center gap-2 text-center text-[10px] tracking-[0.02em] transition-opacity hover:opacity-65";
              const iconClass =
                "flex h-14 w-14 items-center justify-center rounded-full border border-foreground/15";
              if (item.name === "share") {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      void shareVia();
                      close();
                    }}
                    className={`${tileClass} cursor-pointer`}
                  >
                    <span className={iconClass}>
                      <ShareIcon name="share" />
                    </span>
                    <span className="whitespace-nowrap text-foreground opacity-80">
                      {item.label}
                    </span>
                  </button>
                );
              }
              if (item.name === "link") {
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      void copyLink();
                      close();
                    }}
                    className={`${tileClass} cursor-pointer`}
                  >
                    <span className={iconClass}>
                      <ShareIcon name="link" />
                    </span>
                    <span className="whitespace-nowrap text-foreground opacity-80">
                      {copied ? "Copied" : item.label}
                    </span>
                  </button>
                );
              }
              const href =
                item.name === "x"
                  ? `https://twitter.com/intent/tweet?url=${shareUrl()}&text=${shareText()}`
                  : item.name === "facebook"
                    ? `https://www.facebook.com/sharer/sharer.php?u=${shareUrl()}`
                    : item.name === "whatsapp"
                      ? `https://wa.me/?text=${shareText()}%20${shareUrl()}`
                      : item.name === "linkedin"
                        ? `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl()}`
                        : item.name === "messages"
                          ? `sms:?&body=${shareText()}%20${shareUrl()}`
                          : item.name === "threads"
                            ? `https://www.threads.net/intent/post?text=${shareText()}%20${shareUrl()}`
                            : item.name === "pinterest"
                              ? `https://pinterest.com/pin/create/button/?url=${shareUrl()}&description=${shareText()}`
                              : item.name === "telegram"
                                ? `https://t.me/share/url?url=${shareUrl()}&text=${shareText()}`
                                : "https://www.instagram.com/";
              return (
                <a
                  key={item.name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (item.name === "instagram") {
                      void copyLink();
                    }
                    close();
                  }}
                  className={tileClass}
                >
                  <span className={iconClass}>
                    <ShareIcon name={item.name} />
                  </span>
                  <span className="whitespace-nowrap text-foreground opacity-80">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </ResponsiveMenu>
  );
}
