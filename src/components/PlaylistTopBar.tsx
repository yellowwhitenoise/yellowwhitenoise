"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";
import { ShareMenu } from "@/components/ShareMenu";
import { SubscribeForm } from "@/components/SubscribeForm";
import {
  getExistingSubscription,
  getLocalPlaylistSlugs,
  isPushSupported,
  setPushPlaylists,
  subscribePush,
} from "@/lib/push-client";

export function PlaylistTopBar({
  playlistName,
  playlistSlug,
}: {
  playlistName: string;
  playlistSlug: string;
}) {
  const [pushSupported] = useState(() => isPushSupported());
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported) return;
    const frame = requestAnimationFrame(() => {
      void getExistingSubscription().then((subscription) => {
        if (!subscription) return;
        const associated = getLocalPlaylistSlugs().includes(playlistSlug);
        requestAnimationFrame(() => setPushOn(associated));
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [pushSupported, playlistSlug]);

  const togglePlaylistPush = async () => {
    setPushBusy(true);
    try {
      const existing = await getExistingSubscription();
      if (!existing) {
        const subscription = await subscribePush([playlistSlug]);
        setPushOn(Boolean(subscription));
      } else {
        const current = getLocalPlaylistSlugs();
        const next = pushOn
          ? current.filter((slug) => slug !== playlistSlug)
          : [...current, playlistSlug];
        const ok = await setPushPlaylists(next);
        if (ok) setPushOn(!pushOn);
      }
    } finally {
      setPushBusy(false);
    }
  };

  const triggerClass =
    "cursor-pointer text-[10px] uppercase tracking-[0.22em] opacity-60 transition-opacity hover:opacity-100";

  return (
    <header className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center px-5 pt-5 md:px-8 md:pt-6">
      <div className="justify-self-start">
        <ResponsiveMenu
          label="Subscribe"
          mobilePresentation="sheet"
          buttonClassName={triggerClass}
          align="left"
          menuClassName="w-72"
        >
          {(close) => (
            <div className="p-1">
              <p className="font-display text-base font-semibold uppercase tracking-[0.08em]">
                Get updates
              </p>
              <p className="mt-2 text-[11px] leading-relaxed opacity-70">
                Get an email when tracks are added to {playlistName}.
              </p>
              <div className="mt-4">
                <SubscribeForm onSuccess={close} playlistSlug={playlistSlug} />
              </div>
              {pushSupported && (
                <button
                  type="button"
                  onClick={() => void togglePlaylistPush()}
                  disabled={pushBusy}
                  aria-pressed={pushOn}
                  className="mt-3 flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-foreground/15 px-3 py-2.5 text-[11px] transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  <span className="opacity-80">
                    Push alerts for this playlist
                  </span>
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      pushOn ? "bg-yellow" : "bg-foreground/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${
                        pushOn ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              )}
            </div>
          )}
        </ResponsiveMenu>
      </div>

      <Link
        href="/"
        aria-label="Yellow White Noise — Home"
        className="flex flex-col items-center text-foreground transition-opacity hover:opacity-70"
      >
        <Wordmark className="h-14 w-auto max-w-[min(100px,26vw)] object-contain" />
      </Link>

      <div className="justify-self-end">
        <ShareMenu entityName={playlistName} buttonClassName={triggerClass} />
      </div>
    </header>
  );
}
