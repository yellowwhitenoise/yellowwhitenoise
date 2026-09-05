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
    // Rendered a touch smaller than the other tiles by request.
    return (
      <svg viewBox="0 0 300 271" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="m236 0h46l-101 115 118 156h-92.6l-72.5-94.8-83 94.8h-46l107-123-113-148h94.9l65.5 86.6zm-16.1 244h25.5l-165-218h-27.4z" />
      </svg>
    );
  }
  if (name === "facebook") {
    // Facebook "f" glyph (SVG Repo), monochrome to match.
    return (
      <svg viewBox="0 0 512 512" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M283.122,122.174c0,5.24,0,22.319,0,46.583h83.424l-9.045,74.367h-74.379c0,114.688,0,268.375,0,268.375h-98.726c0,0,0-151.653,0-268.375h-51.443v-74.367h51.443c0-29.492,0-50.463,0-56.302c0-27.82-2.096-41.02,9.725-62.578C205.948,28.32,239.308-0.174,297.007,0.512c57.713,0.711,82.04,6.263,82.04,6.263l-12.501,79.257c0,0-36.853-9.731-54.942-6.263C293.539,83.238,283.122,94.366,283.122,122.174z" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    // WhatsApp glyph (SVG Repo), monochrome to match.
    return (
      <svg viewBox="0 0 16 16" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z" />
        <path d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z" />
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
    // Instagram glyph (SVG Repo), monochrome to match.
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path fillRule="evenodd" clipRule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" />
        <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" />
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
