"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getExistingSubscription,
  getPushConfig,
  isPushSupported,
  subscribePush,
  unsubscribePush,
} from "@/lib/push-client";

const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const PROMPT_TIMESTAMP_KEY = "ywn-push-prompt-at";

export function PushPrompt() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAdminRoute || !isPushSupported()) return;
    if (Notification.permission === "denied") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const existing = await getExistingSubscription();
      if (cancelled) return;
      if (existing) {
        setSubscribed(true);
        return;
      }
      const lastPrompt = Number(
        localStorage.getItem(PROMPT_TIMESTAMP_KEY) ?? "0",
      );
      if (!lastPrompt || Date.now() - lastPrompt >= PROMPT_COOLDOWN_MS) {
        const { configured } = await getPushConfig();
        if (!cancelled && configured) {
          localStorage.setItem(PROMPT_TIMESTAMP_KEY, String(Date.now()));
          setVisible(true);
        }
      }
    }, 15000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isAdminRoute]);

  const enable = async () => {
    setBusy(true);
    const subscription = await subscribePush();
    setBusy(false);
    if (subscription) {
      setSubscribed(true);
      setVisible(false);
    } else if (Notification.permission === "denied") {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(PROMPT_TIMESTAMP_KEY, String(Date.now()));
    setVisible(false);
  };

  const disable = async () => {
    setBusy(true);
    await unsubscribePush();
    setBusy(false);
    setSubscribed(false);
  };

  if (isAdminRoute) return null;

  if (subscribed && !visible) {
    return (
      <div className="fixed bottom-24 left-4 z-[70] sm:bottom-6 sm:left-6">
        <button
          type="button"
          onClick={() => void disable()}
          disabled={busy}
          className="cursor-pointer rounded-full border border-foreground/15 bg-background/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] opacity-50 backdrop-blur transition-opacity hover:opacity-100 disabled:opacity-30"
        >
          {busy ? "Working…" : "Push alerts on · Turn off"}
        </button>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Push notifications"
      className="rise-in fixed bottom-24 left-4 z-[70] w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:left-6"
    >
      <div className="rounded-2xl border border-yellow/30 bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow">
              Push alerts
            </p>
            <p className="mt-1 font-display text-lg font-semibold uppercase tracking-[0.08em]">
              Never miss a drop
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="cursor-pointer text-[18px] leading-none opacity-40 transition-opacity hover:opacity-100"
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed opacity-70">
          Get a ping on this device the moment a new track, album or playlist
          lands.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void enable()}
            disabled={busy}
            className="flex-1 cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Enabling…" : "Enable alerts"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] opacity-70 transition-colors hover:bg-foreground/10"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
