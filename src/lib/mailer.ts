import nodemailer from "nodemailer";
import {
  emailLayout,
  replaceEmailTokens,
  type NotifyType,
} from "@/lib/email-templates";
import { getEmailTemplates } from "@/lib/email-template-store";
import { sanitizeLogoUrl } from "@/lib/sanitize";
import {
  getNotificationsEnabled,
  listGlobalSubscribers,
  listPlaylistSubscribers,
  listSubscribersByIds,
  markPlaylistTrackEventsNotified,
  type ArtistReleaseEventRow,
  type PlaylistTrackEventRow,
} from "@/lib/db";
import type { Platform } from "@/lib/data";
import {
  pushPayloadForRelease,
  pushToAllSubscribers,
  pushToPlaylistSubscribers,
} from "@/lib/push";

export type { NotifyType } from "@/lib/email-templates";

interface NotifyTrack {
  title: string;
  artistName: string;
  trackUrl?: string;
}

interface NotifyPayload {
  title: string;
  artist?: string;
  url?: string;
  playlistName?: string;
  trackList?: NotifyTrack[];
  /** Artwork image URL shown above the title when provided. */
  coverUrl?: string;
  /** Per-platform listen links; rendered as CTA buttons for the ones set. */
  platformLinks?: Partial<Record<Platform, string>>;
  /** Release kind for coming-soon announcements. */
  releaseKind?: "track" | "album" | "ep";
}

const FROM =
  process.env.MAIL_FROM ||
  "Yellow White Noise <no-reply@yellowwhitenoise.com>";

function transport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function resendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.RESEND_FROM || FROM;
  return { apiKey, from };
}

async function sendViaResend(
  to: string[],
  subject: string,
  html: string,
): Promise<{ sent: number }> {
  const cfg = resendConfig();
  if (!cfg) return { sent: 0 };
  let sent = 0;
  for (const recipient of to) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: cfg.from,
          to: [recipient],
          subject,
          html,
        }),
      });
      if (response.ok) sent += 1;
    } catch {
      // Keep sending to the remaining recipients.
    }
  }
  return { sent };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function safeUrl(value?: string): string {  if (!value) return "https://www.yellowwhitenoise.com";
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : "https://www.yellowwhitenoise.com";
  } catch {
    return "https://www.yellowwhitenoise.com";
  }
}

function typeLabel(type: NotifyType): string {
  if (type === "playlist") return "playlist";
  if (type === "playlistTrack") return "track added to a playlist";
  if (type === "album") return "album";
  if (type === "ep") return "EP";
  return "track";
}

const PLATFORM_CTA_ORDER: { platform: Platform; label: string }[] = [
  { platform: "spotify", label: "Spotify" },
  { platform: "appleMusic", label: "Apple Music" },
  { platform: "amazonMusic", label: "Amazon Music" },
  { platform: "youtubeMusic", label: "YouTube Music" },
];

function coverImageHtml(coverUrl?: string): string {
  const safe = coverUrl ? safeUrl(coverUrl) : "";
  if (!safe || safe === "https://www.yellowwhitenoise.com") return "";
  return `<p style="margin:0 0 20px;"><img src="${escapeHtml(safe)}" alt="" width="320" style="display:block;width:100%;max-width:320px;height:auto;margin:0 auto;border:0;border-radius:16px;outline:none;" /></p>`;
}

function platformButtonsHtml(
  links?: Partial<Record<Platform, string>>,
): string {
  if (!links) return "";
  const buttons = PLATFORM_CTA_ORDER.filter(
    ({ platform }) => typeof links[platform] === "string" && links[platform],
  )
    .map(
      ({ platform, label }) =>
        `<a href="${escapeHtml(safeUrl(links[platform]))}" style="display:inline-block;margin:6px 6px 0;background:transparent;color:#f5f1e8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:12px 20px;border:1px solid rgba(240,180,41,0.5);border-radius:999px;">${label}</a>`,
    )
    .join("");
  return buttons ? `<p style="margin:20px 0 0;">${buttons}</p>` : "";
}

function trackListHtml(tracks: NotifyTrack[] | undefined): string {  if (!tracks?.length) return "";
  const items = tracks
    .map((track) => {
      const title = escapeHtml(track.title);
      const artist = escapeHtml(track.artistName);
      const listen = track.trackUrl
        ? ` <a href="${escapeHtml(safeUrl(track.trackUrl))}" style="color:#f0b429;">Listen</a>`
        : "";
      return `<li style="margin:7px 0;"><strong>${title}</strong> by ${artist}${listen}</li>`;
    })
    .join("");
  return `<ul style="margin:16px 0;padding-left:20px;text-align:left;">${items}</ul>`;
}

function buildEmail(
  type: NotifyType,
  payload: NotifyPayload,
  unsubscribeUrl: string,
) {
  const label =
    type === "comingSoon"
      ? (payload.releaseKind === "ep"
          ? "EP"
          : (payload.releaseKind ?? "release"))
      : typeLabel(type);
  const playlistName = payload.playlistName ?? "Yellow White Noise";
  const intro =
    type === "playlistTrack"
      ? `New music was added to ${playlistName}.`
      : type === "comingSoon"
        ? `A new ${label} is on its way to Yellow White Noise.`
        : `A new ${label} just landed on the label.`;
  const templates = getEmailTemplates();
  const template = templates[type];
  const subject = replaceEmailTokens(template.subject, {
    title: payload.title,
    artist: payload.artist ?? "",
    playlistName,
    typeLabel: label,
    intro,
    url: safeUrl(payload.url),
  });
  const artistLine = payload.artist
    ? ` by <strong style="color:#f0b429;">${escapeHtml(payload.artist)}</strong>`
    : "";
  const body = replaceEmailTokens(template.html, {
    title: escapeHtml(payload.title),
    artist: escapeHtml(payload.artist ?? ""),
    artistLine,
    playlistName: escapeHtml(playlistName),
    typeLabel: escapeHtml(label),
    intro: escapeHtml(intro),
    url: escapeHtml(safeUrl(payload.url)),
    trackList: trackListHtml(payload.trackList),
    coverImage: coverImageHtml(payload.coverUrl),
    platformButtons: platformButtonsHtml(payload.platformLinks),
    unsubscribe: escapeHtml(unsubscribeUrl),
  });
  const logoUrl = sanitizeLogoUrl(process.env.EMAIL_LOGO_URL);
  return {
    subject,
    html: emailLayout(escapeHtml(payload.title), body, logoUrl).replaceAll(
      "{{unsubscribe}}",
      escapeHtml(unsubscribeUrl),
    ),
  };
}

async function sendEmailToSubscribers(
  type: NotifyType,
  payload: NotifyPayload,
  subscribers: { email: string }[],
): Promise<{ sent: number; total: number; skipped?: string }> {
  if (subscribers.length === 0) return { sent: 0, total: 0 };
  if (!getNotificationsEnabled()) {
    return { sent: 0, total: subscribers.length, skipped: "notifications-disabled" };
  }
  const resend = resendConfig();
  const unsubscribeAddress =
    FROM.match(/<(.+)>/)?.[1] ?? "no-reply@yellowwhitenoise.com";
  const unsubscribeUrl = `mailto:${unsubscribeAddress}?subject=unsubscribe`;
  const email = buildEmail(type, payload, unsubscribeUrl);
  if (resend) {
    const { sent } = await sendViaResend(
      subscribers.map((subscriber) => subscriber.email),
      email.subject,
      email.html,
    );
    return { sent, total: subscribers.length };
  }
  const transporter = transport();
  if (!transporter) {
    return {
      sent: 0,
      total: subscribers.length,
      skipped: "smtp-not-configured",
    };
  }
  let sent = 0;
  for (const subscriber of subscribers) {
    try {
      await transporter.sendMail({
        from: FROM,
        to: subscriber.email,
        subject: email.subject,
        html: email.html,
      });
      sent += 1;
    } catch {
      // Keep sending to the remaining recipients.
    }
  }
  return { sent, total: subscribers.length };
}

export async function notifySubscribers(
  type: NotifyType,
  payload: NotifyPayload,
  subscriberIds?: number[],
): Promise<{ sent: number; total: number; skipped?: string; pushSent?: number }> {
  const subscribers =
    subscriberIds === undefined
      ? listGlobalSubscribers()
      : listSubscribersByIds(subscriberIds);
  const emailResult = await sendEmailToSubscribers(type, payload, subscribers);
  let pushSent = 0;
  // Push endpoints aren't linked to email records, so push only fires on
  // global broadcasts — never on targeted per-recipient sends.
  if (subscriberIds === undefined && getNotificationsEnabled()) {
    try {
      const pushResult = await pushToAllSubscribers(
        pushPayloadForRelease(
          type,
          payload.title,
          payload.artist,
          payload.url ?? "https://www.yellowwhitenoise.com",
          payload.playlistName,
        ),
      );
      pushSent = pushResult.sent;
    } catch {
      // Push is best-effort; email result stands.
    }
  }
  return { ...emailResult, pushSent };
}

export async function notifyPlaylistSubscribers(
  playlistSlug: string,
  playlistName: string,
  events: PlaylistTrackEventRow[],
  extra?: {
    coverUrl?: string;
    platformLinks?: Partial<Record<Platform, string>>;
  },
): Promise<{ sent: number; total: number; skipped?: string; pushSent?: number }> {
  const subscribers = listPlaylistSubscribers(playlistSlug);
  const playlistUrl = `https://www.yellowwhitenoise.com/playlists/${encodeURIComponent(playlistSlug)}`;
  const result = await sendEmailToSubscribers(
    "playlistTrack",
    {
      title: events.length === 1 ? events[0].title : `${events.length} new tracks`,
      artist: events.length === 1 ? events[0].artist_name : undefined,
      url: playlistUrl,
      playlistName,
      trackList: events.map((event) => ({
        title: event.title,
        artistName: event.artist_name,
        trackUrl: event.track_url || undefined,
      })),
      coverUrl: extra?.coverUrl,
      platformLinks: extra?.platformLinks,
    },
    subscribers,
  );
  let pushSent = 0;
  if (getNotificationsEnabled()) {
    try {
      const first = events[0];
      const pushResult = await pushToPlaylistSubscribers(
        playlistSlug,
        pushPayloadForRelease(
          "playlistTrack",
          events.length === 1 && first ? first.title : `${events.length} new tracks`,
          events.length === 1 && first ? first.artist_name : undefined,
          playlistUrl,
          playlistName,
          events.length,
        ),
      );
      pushSent = pushResult.sent;
    } catch {
      // Push is best-effort; email result stands.
    }
  }
  // Mark notified on full success (sent === total covers the no-subscriber
  // case) or on terminal skips. Partial failures stay pending for retry.
  if (result.skipped || result.sent === result.total) {
    markPlaylistTrackEventsNotified(events);
  }
  return { ...result, pushSent };
}

export async function notifyArtistReleaseEvent(
  artistSlug: string,
  event: ArtistReleaseEventRow,
  extra?: {
    coverUrl?: string;
    platformLinks?: Partial<Record<Platform, string>>;
  },
): Promise<{ sent: number; total: number; skipped?: string }> {
  return notifySubscribers(
    event.release_type,
    {
      title: event.title,
      artist: event.artist_name,
      url:
        event.release_url ||
        `https://www.yellowwhitenoise.com/${encodeURIComponent(artistSlug)}`,
      coverUrl: extra?.coverUrl,
      platformLinks: extra?.platformLinks,
    },
  );
}
