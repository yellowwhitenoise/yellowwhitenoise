"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SubscribeForm } from "@/components/SubscribeForm";
import { useSystemBack } from "@/lib/sheet-history";

const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PROMPT_TIMESTAMP_KEY = "ywn-sub-prompt-at";

export function SubscribeModal() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isAdminRoute) return;
    if (localStorage.getItem("ywn-subscribed") === "1") return;
    const timer = setTimeout(() => {
      const lastPrompt = Number(
        localStorage.getItem(PROMPT_TIMESTAMP_KEY) ?? "0",
      );
      const now = new Date().getTime();
      if (!lastPrompt || now - lastPrompt >= PROMPT_COOLDOWN_MS) {
        localStorage.setItem(PROMPT_TIMESTAMP_KEY, String(now));
        setVisible(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isAdminRoute]);

  const dismiss = () => {
    localStorage.setItem(
      PROMPT_TIMESTAMP_KEY,
      String(new Date().getTime()),
    );
    setVisible(false);
  };
  // System back button dismisses the prompt instead of leaving the page.
  const dismissWithHistory = useSystemBack(visible, dismiss);

  const onSuccess = () => {
    localStorage.setItem("ywn-subscribed", "1");
    setDone(true);
    setTimeout(() => dismissWithHistory(), 2500);
  };

  if (isAdminRoute || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Subscribe"
      className="rise-in fixed right-4 bottom-24 z-[70] w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:right-6"
    >
      <div className="rounded-2xl border border-yellow/30 bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow">
              Stay close
            </p>
            <p className="mt-1 font-display text-lg font-semibold uppercase tracking-[0.08em]">
              New drops, first
            </p>
          </div>
          <button
            type="button"
            onClick={dismissWithHistory}
            aria-label="Dismiss"
            className="cursor-pointer text-[18px] leading-none opacity-40 transition-opacity hover:opacity-100"
          >
            ×
          </button>
        </div>
        {done ? (
          <p className="mt-3 text-[12px] leading-relaxed text-yellow">
            You&apos;re on the list. First listen is yours.
          </p>
        ) : (
          <>
            <p className="mt-2 text-[12px] leading-relaxed opacity-70">
              Get an email the moment a new track, album or playlist drops.
            </p>
            <div className="mt-4">
              <SubscribeForm onSuccess={onSuccess} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
