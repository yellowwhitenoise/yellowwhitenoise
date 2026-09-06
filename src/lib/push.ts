import webpush from "web-push";
import {
  listPushSubscriptions,
  listPushSubscriptionsForPlaylist,
  removePushSubscription,
  type PushSubscriptionRow,
} from "@/lib/db";
import type { NotifyType } from "@/lib/email-templates";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

function vapidConfig():
  | { publicKey: string; privateKey: string; subject: string }
  | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    subject:
      process.env.VAPID_SUBJECT || "mailto:no-reply@yellowwhitenoise.com",
  };
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

export function isPushConfigured(): boolean {
  return vapidConfig() !== null;
}

function toPushSubscription(row: PushSubscriptionRow): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  return { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } };
}

async function deliver(
  rows: PushSubscriptionRow[],
  payload: PushPayload,
): Promise<{ sent: number; total: number }> {
  const config = vapidConfig();
  if (!config || rows.length === 0) return { sent: 0, total: rows.length };
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const body = JSON.stringify(payload);
  let sent = 0;
  for (const row of rows) {
    try {
      await webpush.sendNotification(toPushSubscription(row), body);
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? (error as { statusCode?: unknown }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        removePushSubscription(row.endpoint);
      }
    }
  }
  return { sent, total: rows.length };
}

export function pushPayloadForRelease(
  type: NotifyType,
  title: string,
  artist: string | undefined,
  url: string,
  playlistName?: string,
  trackCount?: number,
): PushPayload {
  if (type === "playlistTrack") {
    const name = playlistName ?? "a playlist";
    return {
      title:
        trackCount && trackCount > 1
          ? `${trackCount} new tracks in ${name}`
          : `New track in ${name}: ${title}`,
      body: artist ?? "Yellow White Noise",
      url,
    };
  }
  const kind =
    type === "playlist"
      ? "playlist"
      : type === "album"
        ? "album"
        : type === "ep"
          ? "EP"
          : "track";
  if (
    type === "comingSoonTrack" ||
    type === "comingSoonAlbum" ||
    type === "comingSoonEp"
  ) {
    return {
      title: `Coming soon: ${title}`,
      body: artist ?? "Yellow White Noise",
      url,
    };
  }
  return {
    title: `New ${kind}: ${title}`,
    body: artist ?? "Yellow White Noise",
    url,
  };
}

export async function pushToAllSubscribers(
  payload: PushPayload,
): Promise<{ sent: number; total: number }> {
  return deliver(listPushSubscriptions(), payload);
}

export async function pushToPlaylistSubscribers(
  playlistSlug: string,
  payload: PushPayload,
): Promise<{ sent: number; total: number }> {
  return deliver(listPushSubscriptionsForPlaylist(playlistSlug), payload);
}
