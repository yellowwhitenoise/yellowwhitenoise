"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaRefUploadField } from "@/components/admin/MediaRefUploadField";
import type { MediaRef } from "@/lib/data";

interface PostRow {
  id: number;
  slug: string;
  title: string;
  status: string;
  date: string;
  updated_at: string;
}

interface ArtistRow {
  id: number;
  slug: string;
  name: string;
  genre: string;
  songsCount: number;
  hoverBackdropEnabled: boolean;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
];

export function DashboardClient({
  posts,
  artists,
  activeFilter,
  subscriberCount,
  pushSubscriberCount,
  notificationsEnabled: initialNotifications,
  homeBackdrop: initialHomeBackdrop,
}: {
  posts: PostRow[];
  artists: ArtistRow[];
  activeFilter: string;
  subscriberCount: number;
  pushSubscriberCount: number;
  notificationsEnabled: boolean;
  homeBackdrop?: MediaRef | null;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState(activeFilter);
  const [artistRows, setArtistRows] = useState(artists);
  const [homeBackdrop, setHomeBackdrop] = useState<MediaRef | null>(
    initialHomeBackdrop ?? null,
  );
  const visiblePosts = posts.filter(
    (post) => filter === "all" || post.status === filter,
  );

  const saveHomeBackdrop = async (media: MediaRef | null) => {
    setHomeBackdrop(media);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: "home_backdrop",
        value: media ? JSON.stringify(media) : "",
      }),
    });
    router.refresh();
  };
  const [notifications, setNotifications] = useState(initialNotifications);
  const [type, setType] = useState("playlist");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [url, setUrl] = useState("");
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hoverSavingId, setHoverSavingId] = useState<number | null>(null);
  const [artistNotice, setArtistNotice] = useState<string | null>(null);

  const toggleNotifications = async () => {
    const next = !notifications;
    setNotifications(next);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
  };

  const broadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setBroadcastResult(null);
    const response = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, artist, url }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      sent?: number;
      total?: number;
      skipped?: string;
      error?: string;
      pushSent?: number;
    };
    setBusy(false);
    const pushSuffix =
      typeof data.pushSent === "number" && data.pushSent > 0
        ? ` + ${data.pushSent} push alert(s)`
        : "";
    setBroadcastResult(
      data.error
        ? data.error
        : data.skipped === "smtp-not-configured"
          ? `Queued for ${data.total} subscriber(s) — SMTP not configured, no emails sent.${pushSuffix}`
          : data.skipped === "notifications-disabled"
            ? "Notifications are turned off."
            : `Sent to ${data.sent}/${data.total} subscriber(s)${pushSuffix}.`,
    );
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const removePost = async (id: number) => {
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const removeArtist = async (id: number) => {
    await fetch(`/api/admin/artists/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const toggleArtistHoverBackdrop = async (artist: ArtistRow) => {
    const enabled = !artist.hoverBackdropEnabled;
    setHoverSavingId(artist.id);
    setArtistNotice(null);
    setArtistRows((current) =>
      current.map((entry) =>
        entry.id === artist.id
          ? { ...entry, hoverBackdropEnabled: enabled }
          : entry,
      ),
    );
    const response = await fetch(`/api/admin/artists/${artist.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hoverBackdropEnabled: enabled }),
    });
    setHoverSavingId(null);
    if (!response.ok) {
      setArtistRows((current) =>
        current.map((entry) =>
          entry.id === artist.id
            ? { ...entry, hoverBackdropEnabled: artist.hoverBackdropEnabled }
            : entry,
        ),
      );
      setArtistNotice("Could not update the artist hover backdrop setting.");
      return;
    }
    setArtistNotice(
      enabled
        ? `${artist.name} will use its custom hover backdrop.`
        : `${artist.name} will use the shared homepage backdrop on hover.`,
    );
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-20">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-foreground/10 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Subscribers
          </p>
          <p className="mt-2 font-display text-3xl font-semibold">
            {subscriberCount}
          </p>
          <p className="mt-1 text-[11px] opacity-50">
            {pushSubscriberCount} push device(s)
          </p>
        </div>
        <div className="rounded-2xl border border-foreground/10 p-5">
          <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Email notifications
          </p>
          <button
            type="button"
            onClick={toggleNotifications}
            className={`mt-3 flex h-7 w-14 cursor-pointer items-center rounded-full p-1 transition-colors ${
              notifications ? "bg-yellow" : "bg-foreground/20"
            }`}
            aria-pressed={notifications}
          >
            <span
              className={`h-5 w-5 rounded-full bg-background shadow transition-transform ${
                notifications ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>
          <p className="mt-2 text-[11px] opacity-50">
            {notifications ? "On — emails send automatically" : "Off — no emails sent"}
          </p>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-foreground/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Homepage backdrop
        </p>
        <div className="mt-3">
          <MediaRefUploadField
            label="Neutral homepage backdrop (image or video)"
            value={homeBackdrop ?? undefined}
            onChange={saveHomeBackdrop}
            hint="Plays behind the artists on the homepage. Remove it to use the default gradient."
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <h2 className="text-[11px] uppercase tracking-[0.22em] opacity-50">
          Announce to subscribers
        </h2>
        <form onSubmit={broadcast} className="mt-4 grid gap-3 sm:grid-cols-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
          >
            <option value="playlist" className="bg-background text-foreground">
              New playlist
            </option>
            <option value="album" className="bg-background text-foreground">
              New album
            </option>
            <option value="song" className="bg-background text-foreground">
              New song
            </option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (required)"
            required
            className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow"
          />
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist (optional)"
            className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Link (optional)"
            className="rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow"
          />
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50 sm:col-span-2"
          >
            {busy ? "Sending…" : "Send to subscribers"}
          </button>
        </form>
        {broadcastResult && (
          <p className="mt-3 text-[12px] opacity-70">{broadcastResult}</p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.22em] opacity-50">
            Artists
          </h2>
          <Link
            href="/admin/artists/new"
            className="rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
          >
            New artist
          </Link>
        </div>
        <ul className="mt-4 flex flex-col divide-y divide-foreground/10">
           {artistRows.map((artist) => (
             <li key={artist.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {artist.name}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-40">
                  {artist.genre} · {artist.songsCount} tracks · /{artist.slug}
                </p>
              </div>
               <button
                 type="button"
                 onClick={() => void toggleArtistHoverBackdrop(artist)}
                 disabled={hoverSavingId === artist.id}
                 className={`flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] uppercase tracking-[0.14em] transition-colors disabled:opacity-50 ${
                   artist.hoverBackdropEnabled
                     ? "border-yellow/40 text-yellow hover:bg-yellow/10"
                     : "border-foreground/15 opacity-60 hover:bg-foreground/10"
                 }`}
                 aria-pressed={artist.hoverBackdropEnabled}
               >
                 <span
                   className={`h-3.5 w-3.5 rounded-full p-0.5 ${
                     artist.hoverBackdropEnabled ? "bg-yellow" : "bg-foreground/25"
                   }`}
                 >
                   <span
                     className={`block h-2.5 w-2.5 rounded-full bg-background transition-transform ${
                       artist.hoverBackdropEnabled ? "translate-x-1.5" : "translate-x-0"
                     }`}
                   />
                 </span>
                 {artist.hoverBackdropEnabled ? "Artist hover" : "Homepage backdrop"}
               </button>
               <Link
                href={`/admin/artists/${artist.id}`}
                className="text-[10px] uppercase tracking-[0.18em] underline underline-offset-4 opacity-70 hover:opacity-100"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => removeArtist(artist.id)}
                className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
              >
                Delete
              </button>
            </li>
           ))}
         </ul>
         {artistNotice && (
           <p className="mt-3 text-[11px] text-yellow">{artistNotice}</p>
         )}
       </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[11px] uppercase tracking-[0.22em] opacity-50">
            Blog posts
          </h2>
          <Link
            href="/admin/blog/new"
            className="rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
          >
            New post
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {FILTERS.map((filterOption) => (
            <button
              key={filterOption.id}
              type="button"
              onClick={() => setFilter(filterOption.id)}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                filter === filterOption.id
                  ? "bg-foreground text-background"
                  : "border border-foreground/15 opacity-60 hover:opacity-100"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
        <ul className="mt-4 flex flex-col divide-y divide-foreground/10">
          {visiblePosts.map((post) => (
            <li key={post.id} className="flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{post.title}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] opacity-40">
                  {post.status} · {post.date} · /{post.slug}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] ${
                  post.status === "published"
                    ? "bg-yellow/15 text-yellow"
                    : "bg-foreground/10 opacity-70"
                }`}
              >
                {post.status}
              </span>
              <Link
                href={`/admin/blog/${post.id}`}
                className="text-[10px] uppercase tracking-[0.18em] underline underline-offset-4 opacity-70 hover:opacity-100"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => removePost(post.id)}
                className="cursor-pointer text-[10px] uppercase tracking-[0.18em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
