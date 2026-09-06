"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_EMAIL_TEMPLATES,
  previewEmailHtml,
  type EmailTemplate,
  type NotifyType,
} from "@/lib/email-templates";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow";

const typeLabels: Record<NotifyType, string> = {
  song: "New track",
  album: "New album",
  ep: "New EP",
  comingSoonTrack: "Soon: track",
  comingSoonAlbum: "Soon: album",
  comingSoonEp: "Soon: EP",
  playlist: "New playlist",
  playlistTrack: "Track added to playlist",
};

const NEW_TYPES: NotifyType[] = ["song", "album", "ep", "playlist", "playlistTrack"];

const COMING_SOON_TYPES: NotifyType[] = [
  "comingSoonTrack",
  "comingSoonAlbum",
  "comingSoonEp",
];

export function EmailTemplatesClient({
  initial,
  logoUrl,
}: {
  initial: Record<NotifyType, EmailTemplate>;
  logoUrl?: string;
}) {
  const [templates, setTemplates] = useState(initial);
  const [activeType, setActiveType] = useState<NotifyType>("song");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const template = templates[activeType];
  const isComingSoon =
    activeType === "comingSoonTrack" ||
    activeType === "comingSoonAlbum" ||
    activeType === "comingSoonEp";
  const comingSoonKind =
    activeType === "comingSoonTrack"
      ? "track"
      : activeType === "comingSoonAlbum"
        ? "album"
        : "EP";

  // Coming-soon announcement composer (send-from-here).
  const [artists, setArtists] = useState<string[]>([]);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceArtist, setAnnounceArtist] = useState("");
  const [announceCover, setAnnounceCover] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/artists")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        const names = data
          .map((entry) =>
            typeof entry === "object" && entry !== null
              ? String((entry as Record<string, unknown>).name ?? "")
              : "",
          )
          .map((name) => name.trim())
          .filter(Boolean);
        setArtists([...new Set(names)]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const pickType = (type: NotifyType) => {
    setActiveType(type);
    setNotice(null);
    setError(null);
    setSendResult(null);
  };

  const sendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceArtist) {
      setSendResult("Add a title and pick an artist first.");
      return;
    }
    setSending(true);
    setSendResult(null);
    const response = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: activeType,
        title: announceTitle.trim(),
        artist: announceArtist,
        coverUrl: announceCover.trim() || undefined,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      sent?: number;
      total?: number;
      skipped?: string;
      error?: string;
    };
    setSending(false);
    if (!response.ok || data.error) {
      setSendResult(data.error ?? "Could not send.");
      return;
    }
    if (data.skipped === "smtp-not-configured") {
      setSendResult("SMTP is not configured — nothing was sent.");
    } else if (data.skipped === "notifications-disabled") {
      setSendResult("Email notifications are turned off.");
    } else {
      setSendResult(`Sent to ${data.sent ?? 0}/${data.total ?? 0} subscriber(s).`);
    }
  };

  const updateTemplate = (patch: Partial<EmailTemplate>) => {
    setTemplates((current) => ({
      ...current,
      [activeType]: { ...current[activeType], ...patch },
    }));
  };

  const save = async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    const response = await fetch("/api/admin/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activeType, ...template }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      templates?: Record<NotifyType, EmailTemplate>;
      error?: string;
    };
    setBusy(false);
    if (!response.ok || !data.templates) {
      setError(data.error ?? "Could not save template.");
      return;
    }
    setTemplates(data.templates);
    setNotice(`${typeLabels[activeType]} template saved.`);
  };

  const reset = () => {
    setTemplates((current) => ({
      ...current,
      [activeType]: DEFAULT_EMAIL_TEMPLATES[activeType],
    }));
    setNotice("Default restored locally. Save to apply it.");
    setError(null);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          ← Dashboard
        </Link>
        <Link
          href="/admin/subscribers"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          Manage subscribers
        </Link>
      </div>
      <h1 className="mt-4 font-display text-3xl font-semibold uppercase tracking-[0.1em]">
        Email templates
      </h1>
      <p className="mt-2 max-w-[70ch] text-[12px] leading-relaxed opacity-60">
        Edit the HTML sent for new tracks, albums, and playlists. Templates are
        rendered on the server. Use the supported tokens below instead of
        hardcoding release details.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <ResponsiveMenu
          label="New release templates"
          activeLabel={
            (NEW_TYPES as NotifyType[]).includes(activeType)
              ? typeLabels[activeType]
              : undefined
          }
          buttonClassName={`cursor-pointer rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors ${
            (NEW_TYPES as NotifyType[]).includes(activeType)
              ? "border-yellow/50 text-yellow"
              : "border-foreground/15 opacity-60 hover:bg-foreground/10"
          }`}
        >
          {(close) => (
            <>
              {NEW_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    pickType(type);
                    close();
                  }}
                  className={`block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] transition-colors hover:bg-foreground/10 md:px-3 md:py-2 md:text-[12px] ${
                    activeType === type ? "text-yellow" : ""
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </>
          )}
        </ResponsiveMenu>
        <ResponsiveMenu
          label="Coming soon templates"
          activeLabel={
            (COMING_SOON_TYPES as NotifyType[]).includes(activeType)
              ? typeLabels[activeType]
              : undefined
          }
          buttonClassName={`cursor-pointer rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors ${
            (COMING_SOON_TYPES as NotifyType[]).includes(activeType)
              ? "border-yellow/50 text-yellow"
              : "border-foreground/15 opacity-60 hover:bg-foreground/10"
          }`}
        >
          {(close) => (
            <>
              {COMING_SOON_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    pickType(type);
                    close();
                  }}
                  className={`block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] transition-colors hover:bg-foreground/10 md:px-3 md:py-2 md:text-[12px] ${
                    activeType === type ? "text-yellow" : ""
                  }`}
                >
                  {typeLabels[type]}
                </button>
              ))}
            </>
          )}
        </ResponsiveMenu>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-foreground/10 p-5">
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Subject line
            <input
              value={template.subject}
              onChange={(event) => updateTemplate({ subject: event.target.value })}
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className="mt-5 block text-[10px] uppercase tracking-[0.22em] opacity-50">
            HTML body
            <textarea
              value={template.html}
              onChange={(event) => updateTemplate({ html: event.target.value })}
              rows={22}
              spellCheck={false}
              className={`mt-2 ${inputClass} resize-y font-mono text-[12px] leading-relaxed`}
            />
          </label>
          <p className="mt-4 text-[10px] uppercase tracking-[0.16em] opacity-45">
            Supported tokens
          </p>
          <p className="mt-2 text-[11px] leading-relaxed opacity-60">
            <code>{"{{title}}"}</code> <code>{"{{artist}}"}</code>{" "}
            <code>{"{{artistLine}}"}</code> <code>{"{{typeLabel}}"}</code>{" "}
            <code>{"{{intro}}"}</code> <code>{"{{url}}"}</code>{" "}
            <code>{"{{coverImage}}"}</code>{" "}
            <code>{"{{platformButtons}}"}</code>{" "}
            <code>{"{{unsubscribe}}"}</code>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] opacity-70 transition-colors hover:bg-foreground/10"
            >
              Restore default
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-foreground/10 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Live preview
          </p>
          <p className="mt-2 text-[11px] leading-relaxed opacity-45">
            Preview uses sample release data. The recipient footer and
            unsubscribe link are added automatically.
          </p>
          <iframe
            title={`${typeLabels[activeType]} email preview`}
            srcDoc={previewEmailHtml(template, logoUrl)}
            sandbox=""
            className="mt-5 h-[600px] w-full rounded-xl border border-foreground/10 bg-white"
          />
        </section>
      </div>

      {isComingSoon && (
        <section className="mt-6 rounded-2xl border border-yellow/25 p-5">
          <p className="font-display text-base font-semibold uppercase tracking-[0.08em]">
            Announce this {comingSoonKind}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed opacity-70">
            Sends the template above to all subscribers with this cover,
            artist, and title.
          </p>
          <div className="mt-4 grid gap-4">
            <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              {comingSoonKind === "EP" ? "EP" : comingSoonKind === "album" ? "Album" : "Track"} title
              <input
                value={announceTitle}
                onChange={(event) => setAnnounceTitle(event.target.value)}
                placeholder={
                  comingSoonKind === "EP"
                    ? "Midnight Riddims EP"
                    : comingSoonKind === "album"
                      ? "Yellow Hours"
                      : "Low Tide Gospel"
                }
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <div className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              Artist
              <div className="mt-2">
                {artists.length > 0 ? (
                  <ResponsiveMenu
                    label="Select artist"
                    activeLabel={announceArtist || undefined}
                    buttonClassName="w-full cursor-pointer rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-left text-[13px] text-foreground outline-none transition-colors hover:bg-foreground/10"
                  >
                    {(close) => (
                      <>
                        {artists.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setAnnounceArtist(name);
                              close();
                            }}
                            className={`block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] transition-colors hover:bg-foreground/10 md:px-3 md:py-2 md:text-[12px] ${
                              announceArtist === name ? "text-yellow" : ""
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </>
                    )}
                  </ResponsiveMenu>
                ) : (
                  <p className="text-[11px] normal-case tracking-normal opacity-50">
                    No artists yet — add one first.
                  </p>
                )}
              </div>
            </div>
            <div className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              Cover art
              <div className="mt-2">
                <ImageUploadField
                  value={announceCover}
                  onChange={setAnnounceCover}
                  placeholder="https://… or upload from device or media"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void sendAnnouncement()}
            disabled={sending}
            className="mt-5 cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {sending ? "Sending…" : `Announce ${comingSoonKind}`}
          </button>
          {sendResult && (
            <p className="mt-3 text-[12px] text-yellow">{sendResult}</p>
          )}
        </section>
      )}

      {error && <p className="mt-5 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-5 text-[12px] text-yellow">{notice}</p>}
    </main>
  );
}
