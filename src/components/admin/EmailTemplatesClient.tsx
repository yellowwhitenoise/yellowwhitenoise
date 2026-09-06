"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_TYPES,
  previewEmailHtml,
  type EmailTemplate,
  type NotifyType,
} from "@/lib/email-templates";

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow";

const typeLabels: Record<NotifyType, string> = {
  song: "New track",
  album: "New album",
  ep: "New EP",
  comingSoon: "Coming soon",
  playlist: "New playlist",
  playlistTrack: "Track added to playlist",
};

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
        {EMAIL_TEMPLATE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setActiveType(type);
              setNotice(null);
              setError(null);
            }}
            className={`cursor-pointer rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors ${
              activeType === type
                ? "border-yellow/50 text-yellow"
                : "border-foreground/15 opacity-60 hover:bg-foreground/10"
            }`}
          >
            {typeLabels[type]}
          </button>
        ))}
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

      {error && <p className="mt-5 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-5 text-[12px] text-yellow">{notice}</p>}
    </main>
  );
}
