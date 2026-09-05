"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlaylistRow } from "@/lib/db";
import type { Platform } from "@/lib/data";

interface ManagedPlaylist {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverUrl: string;
  links: Partial<Record<Platform, string>>;
  sourcePlatform: string;
  sourceUrl: string;
  trackCount: number;
  visible: boolean;
  sortOrder: number;
  lastSyncedAt: string | null;
  lastSyncAttemptAt: string | null;
  syncError: string;
}

interface SyncReport {
  id: number;
  name: string;
  ok: boolean;
  error?: string;
  row?: PlaylistRow;
}

const platforms: { key: Platform; label: string }[] = [
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "amazonMusic", label: "Amazon Music" },
  { key: "youtubeMusic", label: "YouTube Music" },
];

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow";

function parseLinks(raw: string): Partial<Record<Platform, string>> {
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null) return {};
    const source = value as Record<string, unknown>;
    const links: Partial<Record<Platform, string>> = {};
    for (const platform of platforms) {
      const link = source[platform.key];
      if (typeof link === "string") links[platform.key] = link;
    }
    return links;
  } catch {
    return {};
  }
}

function trackCount(raw: string): number {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

function toManaged(row: PlaylistRow): ManagedPlaylist {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    coverUrl: row.cover_url ?? "",
    links: parseLinks(row.links),
    sourcePlatform: row.source_platform,
    sourceUrl: row.source_url,
    trackCount: trackCount(row.entries),
    visible: row.visible === 1,
    sortOrder: row.sort_order,
    lastSyncedAt: row.last_synced_at,
    lastSyncAttemptAt: row.last_sync_attempt_at,
    syncError: row.sync_error,
  };
}

function formatSyncTime(value: string | null): string {
  if (!value) return "Never";
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DiscoveredPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  isPublic?: boolean;
  url: string;
  coverUrl?: string;
  ownerName?: string;
}

export function PlaylistManagerClient({
  initial,
  initialAccounts,
  spotifyStatus: initialSpotifyStatus,
  spotifyNotice,
}: {
  initial: PlaylistRow[];
  initialAccounts?: {
    spotify: string;
    youtube: string;
    apple: string;
    amazon: string;
  };
  spotifyStatus?: { userName: string | null; userId: string | null } | null;
  spotifyNotice?: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial.map(toManaged));
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(spotifyNotice ?? null);
  const [accounts, setAccounts] = useState({
    spotify: initialAccounts?.spotify ?? "",
    youtube: initialAccounts?.youtube ?? "",
    apple: initialAccounts?.apple ?? "",
    amazon: initialAccounts?.amazon ?? "",
  });
  const [savingAccount, setSavingAccount] = useState<string | null>(null);
  const [spotify, setSpotify] = useState(initialSpotifyStatus ?? null);
  const [discovering, setDiscovering] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<{
    spotify: DiscoveredPlaylist[];
    youtube: DiscoveredPlaylist[];
  }>({ spotify: [], youtube: [] });
  const [importingDiscovered, setImportingDiscovered] = useState<string | null>(
    null,
  );
  const [clearingCache, setClearingCache] = useState(false);

  const updateLocal = (id: number, patch: Partial<ManagedPlaylist>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const clearCache = async () => {
    setClearingCache(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/cache/clear", {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        cleared?: number;
      };
      if (!response.ok) throw new Error();
      setNotice(
        `Cleared ${data.cleared ?? 0} cached track resolution(s). Tracks re-resolve on next view.`,
      );
    } catch {
      setError("Could not clear the resolution cache.");
    } finally {
      setClearingCache(false);
    }
    router.refresh();
  };

  const importPlaylist = async (event: React.FormEvent) => {
    event.preventDefault();
    setImporting(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = (await response.json().catch(() => ({}))) as
      | PlaylistRow
      | { error?: string };
    setImporting(false);
    if (!response.ok || !("id" in data)) {
      setError("error" in data ? data.error ?? "Import failed." : "Import failed.");
      return;
    }
    setItems((current) => [
      toManaged(data),
      ...current.filter((item) => item.id !== data.id),
    ]);
    setUrl("");
    setNotice("Imported or refreshed. Turn on “Show publicly” when ready.");
    router.refresh();
  };

  const save = async (item: ManagedPlaylist) => {
    setSavingId(item.id);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/admin/playlists/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        coverUrl: item.coverUrl || null,
        links: item.links,
        visible: item.visible,
        sortOrder: item.sortOrder,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as
      | PlaylistRow
      | { error?: string };
    setSavingId(null);
    if (!response.ok || !("id" in data)) {
      setError("error" in data ? data.error ?? "Save failed." : "Save failed.");
      return;
    }
    updateLocal(item.id, toManaged(data));
    setNotice(`${item.name} saved.`);
    router.refresh();
  };

  const syncOne = async (item: ManagedPlaylist) => {
    setSyncingId(item.id);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/playlists/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      reports?: SyncReport[];
      rows?: PlaylistRow[];
      error?: string;
    };
    setSyncingId(null);
    const report = data.reports?.[0];
    if (!response.ok || !report) {
      setError(data.error ?? "Sync failed.");
      return;
    }
    if (!report.ok || !report.row) {
      setError(report.error ?? `Could not sync ${item.name}.`);
      return;
    }
    updateLocal(item.id, toManaged(report.row));
    setNotice(`${report.row.name} synced.`);
    router.refresh();
  };

  const syncAll = async () => {
    setSyncingAll(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/playlists/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = (await response.json().catch(() => ({}))) as {
      reports?: SyncReport[];
      rows?: PlaylistRow[];
      error?: string;
    };
    setSyncingAll(false);
    if (!response.ok || !data.reports) {
      setError(data.error ?? "Sync failed.");
      return;
    }
    if (data.rows) setItems(data.rows.map(toManaged));
    const failed = data.reports.filter((report) => !report.ok).length;
    setNotice(
      failed
        ? `Sync finished with ${failed} error${failed === 1 ? "" : "s"}.`
        : `Synced ${data.reports.length} playlist${data.reports.length === 1 ? "" : "s"}.`,
    );
    router.refresh();
  };

  const saveAccount = async (
    platform: "spotify" | "youtube" | "apple" | "amazon",
  ) => {
    setSavingAccount(platform);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: `${platform}_account_url`,
        value: accounts[platform],
      }),
    });
    setSavingAccount(null);
    if (!response.ok) {
      setError("Could not save that account URL.");
      return;
    }
    setNotice("Account URL saved.");
    router.refresh();
  };

  const disconnectSpotify = async () => {
    setError(null);
    setNotice(null);
    const response = await fetch("/api/auth/spotify/disconnect", {
      method: "POST",
    });
    if (!response.ok) {
      setError("Could not disconnect Spotify.");
      return;
    }
    setSpotify(null);
    setDiscovered((current) => ({ ...current, spotify: [] }));
    setNotice("Spotify disconnected.");
    router.refresh();
  };

  const discover = async (platform: "spotify" | "youtube") => {
    setDiscovering(platform);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/integrations/${platform}/playlists`);
    const data = (await response.json().catch(() => ({}))) as {
      playlists?: DiscoveredPlaylist[];
      error?: string;
    };
    setDiscovering(null);
    if (!response.ok || !data.playlists) {
      setError(data.error ?? "Could not list that account's playlists.");
      return;
    }
    setDiscovered((current) => ({ ...current, [platform]: data.playlists ?? [] }));
    setNotice(
      data.playlists.length === 0
        ? "No playlists found on that account."
        : `Found ${data.playlists.length} playlist${data.playlists.length === 1 ? "" : "s"}.`,
    );
  };

  const importDiscovered = async (playlistUrl: string) => {
    setImportingDiscovered(playlistUrl);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/admin/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: playlistUrl }),
    });
    const data = (await response.json().catch(() => ({}))) as
      | PlaylistRow
      | { error?: string };
    setImportingDiscovered(null);
    if (!response.ok || !("id" in data)) {
      setError("error" in data ? data.error ?? "Import failed." : "Import failed.");
      return;
    }
    setItems((current) => [
      toManaged(data),
      ...current.filter((item) => item.id !== data.id),
    ]);
    setNotice("Imported. Turn on “Show publicly” when ready.");
    router.refresh();
  };

  const remove = async (item: ManagedPlaylist) => {
    if (!window.confirm(`Delete “${item.name}” from the playlist manager?`)) return;
    setDeletingId(item.id);
    setError(null);
    const response = await fetch(`/api/admin/playlists/${item.id}`, {
      method: "DELETE",
    });
    setDeletingId(null);
    if (!response.ok) {
      setError("Could not delete that playlist.");
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setNotice(`${item.name} deleted.`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20 pt-10">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          ← Dashboard
        </Link>
        <Link
          href="/playlists"
          target="_blank"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          View playlists ↗
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-[0.1em]">
          Playlists
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void clearCache()}
            disabled={clearingCache || syncingAll}
            className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] opacity-70 transition-colors hover:bg-foreground/10 disabled:opacity-50"
          >
            {clearingCache ? "Clearing…" : "Clear resolution cache"}
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => void syncAll()}
              disabled={syncingAll || syncingId !== null}
              className="cursor-pointer rounded-full border border-yellow/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-yellow transition-colors hover:bg-yellow/10 disabled:opacity-50"
            >
              {syncingAll ? "Syncing…" : "Sync all now"}
            </button>
          )}
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-yellow/25 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-yellow">
          Import from a streaming account
        </p>
        <p className="mt-2 max-w-[70ch] text-[12px] leading-relaxed opacity-60">
          Paste a public playlist share link from Spotify, Apple Music, or
          YouTube Music. The server imports the playlist and tracks; nothing
          is published until you turn on “Show publicly”. For Amazon Music
          (no import API), import from one of the supported platforms, then
          add the Amazon playlist URL in that playlist&apos;s streaming
          destinations below.
        </p>
        <form onSubmit={importPlaylist} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            type="url"
            placeholder="https://open.spotify.com/playlist/..."
            className={`${inputClass} flex-1`}
          />
          <button
            type="submit"
            disabled={importing}
            className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {importing ? "Importing…" : "Import playlist"}
          </button>
        </form>
        <p className="mt-3 text-[10px] leading-relaxed opacity-40">
          Public playlists are required. Spotify needs app credentials,
          YouTube Music needs an API key, and Apple Music needs a developer
          token configured in the server environment.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Connected accounts
        </p>
        <p className="mt-2 max-w-[70ch] text-[12px] leading-relaxed opacity-60">
          Save the Yellow White Noise profile for each platform, then discover
          that account&apos;s public playlists below instead of pasting links
          one by one. Manual share-link imports above keep working.
        </p>
        <div className="mt-4 grid gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              Spotify account profile URL
              <span className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={accounts.spotify}
                  onChange={(event) =>
                    setAccounts((current) => ({
                      ...current,
                      spotify: event.target.value,
                    }))
                  }
                  placeholder="https://open.spotify.com/user/…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void saveAccount("spotify")}
                  disabled={savingAccount === "spotify"}
                  className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  {savingAccount === "spotify" ? "Saving…" : "Save"}
                </button>
              </span>
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {spotify ? (
                <>
                  <p className="text-[11px] opacity-60">
                    Connected{spotify.userName ? ` as ${spotify.userName}` : ""} — private playlists included.
                  </p>
                  <button
                    type="button"
                    onClick={() => void disconnectSpotify()}
                    className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <Link
                  href="/api/auth/spotify/login"
                  className="inline-block cursor-pointer rounded-full bg-[#1DB954] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85"
                >
                  Connect Spotify account
                </Link>
              )}
              <button
                type="button"
                onClick={() => void discover("spotify")}
                disabled={discovering === "spotify"}
                className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
              >
                {discovering === "spotify" ? "Discovering…" : "Discover playlists"}
              </button>
            </div>
            {discovered.spotify.length > 0 && (
              <ul className="mt-3 divide-y divide-foreground/10 rounded-xl border border-foreground/10">
                {discovered.spotify.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {playlist.name}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-40">
                        {playlist.trackCount} tracks ·{" "}
                        {playlist.isPublic ? "public" : "private"}
                        {playlist.ownerName ? ` · ${playlist.ownerName}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void importDiscovered(playlist.url)}
                      disabled={importingDiscovered === playlist.url}
                      className="cursor-pointer rounded-full bg-foreground px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {importingDiscovered === playlist.url ? "Importing…" : "Import"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              YouTube channel URL
              <span className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={accounts.youtube}
                  onChange={(event) =>
                    setAccounts((current) => ({
                      ...current,
                      youtube: event.target.value,
                    }))
                  }
                  placeholder="https://www.youtube.com/@… or /channel/UC…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void saveAccount("youtube")}
                  disabled={savingAccount === "youtube"}
                  className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  {savingAccount === "youtube" ? "Saving…" : "Save"}
                </button>
              </span>
            </label>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => void discover("youtube")}
                disabled={discovering === "youtube"}
                className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
              >
                {discovering === "youtube" ? "Discovering…" : "Discover playlists"}
              </button>
            </div>
            {discovered.youtube.length > 0 && (
              <ul className="mt-3 divide-y divide-foreground/10 rounded-xl border border-foreground/10">
                {discovered.youtube.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {playlist.name}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-40">
                        {playlist.trackCount} tracks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void importDiscovered(playlist.url)}
                      disabled={importingDiscovered === playlist.url}
                      className="cursor-pointer rounded-full bg-foreground px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                    >
                      {importingDiscovered === playlist.url ? "Importing…" : "Import"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              Apple Music profile URL
              <span className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={accounts.apple}
                  onChange={(event) =>
                    setAccounts((current) => ({
                      ...current,
                      apple: event.target.value,
                    }))
                  }
                  placeholder="https://music.apple.com/…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void saveAccount("apple")}
                  disabled={savingAccount === "apple"}
                  className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  {savingAccount === "apple" ? "Saving…" : "Save"}
                </button>
              </span>
            </label>
            <p className="mt-2 text-[11px] leading-relaxed opacity-40">
              Apple offers no free playlist API, so account discovery
              isn&apos;t available. Import Apple playlists with a share link
              above, or sync the same songs from Spotify/YouTube and keep the
              Apple URL as the fan link. Artist albums and tracks still sync
              through the free iTunes catalog.
            </p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
              Amazon Music profile URL
              <span className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={accounts.amazon}
                  onChange={(event) =>
                    setAccounts((current) => ({
                      ...current,
                      amazon: event.target.value,
                    }))
                  }
                  placeholder="https://music.amazon.com/…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => void saveAccount("amazon")}
                  disabled={savingAccount === "amazon"}
                  className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
                >
                  {savingAccount === "amazon" ? "Saving…" : "Save"}
                </button>
              </span>
            </label>
            <p className="mt-2 text-[11px] leading-relaxed opacity-40">
              Amazon Music offers no playlist API, so account discovery
              isn&apos;t available. Import the playlist from
              Spotify/YouTube/Apple with a share link above, then paste the
              matching Amazon playlist URL into that playlist&apos;s
              streaming destinations below — tracks keep syncing from the
              source while Amazon stays as the fan link.
            </p>
          </div>
        </div>
      </section>

      {error && <p className="mt-5 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-5 text-[12px] text-yellow">{notice}</p>}

      {items.length === 0 ? (
        <p className="mt-10 text-[12px] opacity-50">
          No imported playlists yet.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-foreground/10 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-45">
                    {item.sourcePlatform} · {item.trackCount} tracks · /{item.slug}
                  </p>
                  <h2 className="mt-2 text-lg font-medium">{item.name}</h2>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block truncate text-[10px] opacity-45 underline underline-offset-4 hover:text-yellow"
                    >
                      Open source playlist ↗
                  </a>
                  )}
                  <p className="mt-2 text-[10px] uppercase tracking-[0.14em] opacity-40">
                    Last synced {formatSyncTime(item.lastSyncedAt)} · checked {formatSyncTime(item.lastSyncAttemptAt)}
                  </p>
                  {item.syncError && (
                    <p className="mt-1 max-w-[55ch] text-[11px] normal-case tracking-normal text-red-400">
                      {item.syncError}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => updateLocal(item.id, { visible: !item.visible })}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    item.visible
                      ? "border-yellow/50 text-yellow hover:bg-yellow/10"
                      : "border-foreground/15 opacity-60 hover:bg-foreground/10"
                  }`}
                >
                  {item.visible ? "Shown publicly" : "Hidden"}
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
                  Playlist name
                  <input
                    value={item.name}
                    onChange={(event) => updateLocal(item.id, { name: event.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
                  Tagline
                  <input
                    value={item.tagline}
                    onChange={(event) => updateLocal(item.id, { tagline: event.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
                <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
                  Description
                  <textarea
                    value={item.description}
                    onChange={(event) => updateLocal(item.id, { description: event.target.value })}
                    rows={3}
                    className={`mt-2 ${inputClass} resize-y leading-relaxed`}
                  />
                </label>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">
                    Streaming playlist destinations
                  </p>
                  <p className="mt-1 text-[11px] normal-case leading-relaxed opacity-40">
                    Add the matching playlist URL for each platform. Blank URLs
                    stay hidden on the public playlist page.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {platforms.map((platform) => (
                    <label
                      key={platform.key}
                      className="block text-[10px] uppercase tracking-[0.18em] opacity-50"
                    >
                      {platform.label} playlist URL
                      <input
                        value={item.links[platform.key] ?? ""}
                        onChange={(event) =>
                          updateLocal(item.id, {
                            links: {
                              ...item.links,
                              [platform.key]: event.target.value,
                            },
                          })
                        }
                        placeholder={`https://${platform.key === "spotify" ? "open.spotify.com" : platform.key === "appleMusic" ? "music.apple.com" : platform.key === "amazonMusic" ? "music.amazon.com" : "music.youtube.com"}/…`}
                        className={`mt-2 ${inputClass}`}
                      />
                    </label>
                  ))}
                </div>
                <label className="block max-w-32 text-[10px] uppercase tracking-[0.18em] opacity-50">
                  Display order
                  <input
                    type="number"
                    min={0}
                    value={item.sortOrder}
                    onChange={(event) =>
                      updateLocal(item.id, {
                        sortOrder: Number(event.target.value) || 0,
                      })
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-foreground/10 pt-4">
                <button
                  type="button"
                  onClick={() => void syncOne(item)}
                  disabled={syncingId === item.id || syncingAll}
                  className="cursor-pointer rounded-full border border-yellow/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-yellow transition-colors hover:bg-yellow/10 disabled:opacity-50"
                >
                  {syncingId === item.id ? "Syncing…" : "Sync now"}
                </button>
                <button
                  type="button"
                  onClick={() => void save(item)}
                  disabled={savingId === item.id}
                  className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {savingId === item.id ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(item)}
                  disabled={deletingId === item.id}
                  className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-red-400/80 underline underline-offset-4 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
