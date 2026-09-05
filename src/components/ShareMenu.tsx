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
    // Official X logo (Wikimedia Commons), monochrome to match.
    return (
      <svg viewBox="0 0 300 271" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z" />
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
    // Telegram glyph (SVG Repo), stroke adapted to match the tile style.
    return (
      <svg viewBox="0 0 192 192" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="12" aria-hidden>
        <path d="M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z" />
      </svg>
    );
  }
  if (name === "threads") {
    // Official Threads mark (Wikimedia Commons), monochrome to match.
    return (
      <svg viewBox="0 0 192 192" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
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
  // Official Pinterest badge (Wikimedia Commons), monochrome to match.
  return (
    <svg viewBox="0 0 144 144" className="h-7 w-7" fill="currentColor" aria-hidden>
      <path d="M71.9,5.4C35.1,5.4,5.3,35.2,5.3,72c0,28.2,17.5,52.3,42.3,62c-0.6-5.3-1.1-13.3,0.2-19.1c1.2-5.2,7.8-33.1,7.8-33.1s-2-4-2-9.9c0-9.3,5.4-16.2,12-16.2c5.7,0,8.4,4.3,8.4,9.4c0,5.7-3.6,14.3-5.5,22.2c-1.6,6.6,3.3,12,9.9,12c11.8,0,20.9-12.5,20.9-30.5c0-15.9-11.5-27.1-27.8-27.1c-18.9,0-30.1,14.2-30.1,28.9c0,5.7,2.2,11.9,5,15.2c0.5,0.7,0.6,1.2,0.5,1.9c-0.5,2.1-1.6,6.6-1.8,7.5c-0.3,1.2-1,1.5-2.2,0.9c-8.3-3.9-13.5-16-13.5-25.8c0-21,15.3-40.3,44-40.3c23.1,0,41,16.5,41,38.4c0,22.9-14.5,41.4-34.5,41.4c-6.7,0-13.1-3.5-15.3-7.6c0,0-3.3,12.7-4.1,15.8c-1.5,5.8-5.6,13-8.3,17.5c6.2,1.9,12.8,3,19.7,3c36.8,0,66.6-29.8,66.6-66.6C138.5,35.2,108.7,5.4,71.9,5.4z" />
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
  placement = "below",
}: {
  entityName: string;
  text?: string;
  label?: string;
  align?: "left" | "right";
  buttonClassName?: string;
  menuClassName?: string;
  placement?: "below" | "above";
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
      placement={placement}
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
              if (item.name === "link" || item.name === "instagram") {
                const isInstagram = item.name === "instagram";
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
                      <ShareIcon name={item.name} />
                    </span>
                    <span className="whitespace-nowrap text-foreground opacity-80">
                      {copied ? "Copied" : isInstagram ? "Copy for IG" : item.label}
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
                  onClick={close}
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
