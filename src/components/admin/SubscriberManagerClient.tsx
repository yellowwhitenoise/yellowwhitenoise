"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SubscriberRow } from "@/lib/db";
import {
  EMAIL_TEMPLATE_TYPES,
  type NotifyType,
} from "@/lib/email-templates";

type SubscriberFilter = "all" | "active" | "unsubscribed";

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

function formatDate(value: string): string {
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SubscriberManagerClient({
  initial,
}: {
  initial: SubscriberRow[];
}) {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState(initial);
  const [selected, setSelected] = useState<number[]>([]);
  const [filter, setFilter] = useState<SubscriberFilter>("active");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<NotifyType>("playlist");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeCount = subscribers.filter((entry) => entry.status === "active").length;
  const unsubscribedCount = subscribers.length - activeCount;
  const visible = subscribers.filter((entry) => {
    if (filter !== "all" && entry.status !== filter) return false;
    return entry.email.includes(search.trim().toLowerCase());
  });
  const selectedSet = new Set(selected);
  const allVisibleSelected =
    visible.length > 0 && visible.every((entry) => selectedSet.has(entry.id));
  const selectedActiveCount = selected.filter(
    (id) => subscribers.find((entry) => entry.id === id)?.status === "active",
  ).length;

  const replaceSubscribers = (data: unknown): boolean => {
    if (!Array.isArray(data)) return false;
    setSubscribers(data as SubscriberRow[]);
    return true;
  };

  const toggleSelected = (id: number) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const toggleVisible = () => {
    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter((id) => !visible.some((entry) => entry.id === id)),
      );
    } else {
      setSelected((current) => [
        ...new Set([...current, ...visible.map((entry) => entry.id)]),
      ]);
    }
  };

  const changeStatus = async (status: "active" | "unsubscribed") => {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/subscribers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected, status }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !replaceSubscribers(data)) {
      setError(data.error ?? "Could not update subscribers.");
      return;
    }
    setSelected([]);
    setNotice(
      `${selected.length} subscriber${selected.length === 1 ? "" : "s"} ${status === "active" ? "reactivated" : "unsubscribed"}.`,
    );
    router.refresh();
  };

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} subscriber(s) permanently?`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !replaceSubscribers(data)) {
      setError(data.error ?? "Could not delete subscribers.");
      return;
    }
    setSelected([]);
    setNotice("Selected subscribers deleted.");
    router.refresh();
  };

  const sendNewsletter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedActiveCount === 0) {
      setError("Select at least one active subscriber.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title,
        artist,
        url,
        subscriberIds: selected,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      sent?: number;
      total?: number;
      skipped?: string;
      error?: string;
    };
    setBusy(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setNotice(
      data.skipped === "smtp-not-configured"
        ? `Selected ${data.total} recipient(s) — SMTP is not configured.`
        : data.skipped === "notifications-disabled"
          ? "Email notifications are turned off."
          : `Sent to ${data.sent}/${data.total} selected recipient(s).`,
    );
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
          href="/admin/email"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          Edit email templates
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-[0.1em]">
            Subscribers
          </h1>
          <p className="mt-2 text-[12px] opacity-55">
            {activeCount} active · {unsubscribedCount} unsubscribed
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Recipient list
          </p>
          <div className="flex flex-wrap gap-2">
            {(["all", "active", "unsubscribed"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  filter === value
                    ? "border-yellow/50 text-yellow"
                    : "border-foreground/15 opacity-60 hover:bg-foreground/10"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search email"
            className={`${inputClass} flex-1`}
          />
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] opacity-60">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleVisible}
              className="h-4 w-4 accent-yellow"
            />
            Select visible
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 text-[12px] opacity-50">No subscribers found.</p>
        ) : (
          <ul className="mt-5 divide-y divide-foreground/10">
            {visible.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex flex-wrap items-center gap-3 py-3"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(subscriber.id)}
                  onChange={() => toggleSelected(subscriber.id)}
                  className="h-4 w-4 shrink-0 accent-yellow"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{subscriber.email}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.15em] opacity-40">
                    {subscriber.status} ·{" "}
                    {subscriber.global_updates === 1
                      ? "all YWN updates"
                      : "playlist updates only"}{" "}
                    · {subscriber.playlist_count} playlist
                    {subscriber.playlist_count === 1 ? "" : "s"} · joined{" "}
                    {formatDate(subscriber.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] ${
                    subscriber.status === "active"
                      ? "bg-yellow/15 text-yellow"
                      : "border border-foreground/15 opacity-50"
                  }`}
                >
                  {subscriber.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4">
          <span className="text-[10px] uppercase tracking-[0.16em] opacity-45">
            {selected.length} selected
          </span>
          <button
            type="button"
            onClick={() => void changeStatus("unsubscribed")}
            disabled={busy || selected.length === 0}
            className="cursor-pointer rounded-full border border-red-400/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-red-400/85 transition-colors hover:bg-red-400/10 disabled:opacity-40"
          >
            Unsubscribe selected
          </button>
          <button
            type="button"
            onClick={() => void changeStatus("active")}
            disabled={busy || selected.length === 0}
            className="cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10 disabled:opacity-40"
          >
            Reactivate selected
          </button>
          <button
            type="button"
            onClick={() => void deleteSelected()}
            disabled={busy || selected.length === 0}
            className="cursor-pointer text-[10px] uppercase tracking-[0.16em] text-red-400/80 underline underline-offset-4 hover:text-red-400 disabled:opacity-40"
          >
            Delete permanently
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-yellow/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow">
              Send update to selected
            </p>
            <p className="mt-2 text-[11px] leading-relaxed opacity-55">
              {selectedActiveCount} active recipient(s) selected. The matching
              template from the Email section will be used.
            </p>
          </div>
          <Link
            href="/admin/email"
            className="text-[10px] uppercase tracking-[0.16em] underline underline-offset-4 opacity-60 hover:text-yellow"
          >
            Preview templates
          </Link>
        </div>
        <form onSubmit={sendNewsletter} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as NotifyType)}
            className={inputClass}
          >
            {EMAIL_TEMPLATE_TYPES.map((value) => (
              <option key={value} value={value}>
                {typeLabels[value]}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Release title"
            required
            className={inputClass}
          />
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            placeholder="Artist (optional)"
            className={inputClass}
          />
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Release or playlist URL (optional)"
            type="url"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy || selectedActiveCount === 0}
            className="cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50 sm:col-span-2"
          >
            {busy ? "Working…" : "Send newsletter"}
          </button>
        </form>
      </section>

      {error && <p className="mt-5 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-5 text-[12px] text-yellow">{notice}</p>}
    </main>
  );
}
