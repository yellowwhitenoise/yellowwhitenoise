"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { MediaRefUploadField } from "@/components/admin/MediaRefUploadField";
import { platformHomeUrls, type MediaRef } from "@/lib/data";

interface SongDraft {
  slug?: string;
  title: string;
  releaseYear: string;
  type: string;
  album: string;
  coverUrl?: string;
  previewUrl?: string;
  isrc?: string;
  links?: { spotify?: string; appleMusic?: string; youtubeMusic?: string };
  platformIds?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

interface AlbumDraft {
  title: string;
  spotify: string;
  appleMusic: string;
  youtubeMusic: string;
  isrc?: string;
  platformIds?: {
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
  };
}

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow";

export function ArtistEditor({
  artist,
}: {
  artist: {
    id?: number;
    name: string;
    genre: string;
    tagline: string;
    shortBio: string;
    longBio: string;
    palette: { from: string; to: string };
    albums: {
      title: string;
      links: { spotify: string; appleMusic: string; youtubeMusic: string };
      isrc?: string;
      platformIds?: {
        spotify?: string;
        appleMusic?: string;
        youtubeMusic?: string;
      };
    }[];
    songs: SongDraft[];
    homeImage: string;
    pageImage: string;
    backdrop: MediaRef | null;
    hoverMedia: MediaRef | null;
    syncSources: {
      spotify?: string;
      appleMusic?: string;
      youtubeMusic?: string;
    };
    syncEnabled: boolean;
    lastSyncedAt: string | null;
    lastSyncAttemptAt: string | null;
    syncError: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(artist.name);
  const [genre, setGenre] = useState(artist.genre);
  const [tagline, setTagline] = useState(artist.tagline);
  const [shortBio, setShortBio] = useState(artist.shortBio);
  const [longBio, setLongBio] = useState(artist.longBio);
  const [paletteFrom, setPaletteFrom] = useState(artist.palette.from);
  const [paletteTo, setPaletteTo] = useState(artist.palette.to);
  const [homeImage, setHomeImage] = useState(artist.homeImage);
  const [pageImage, setPageImage] = useState(artist.pageImage);
  const [backdrop, setBackdrop] = useState<MediaRef | null>(
    artist.backdrop ?? null,
  );
  const [hoverMedia, setHoverMedia] = useState<MediaRef | null>(
    artist.hoverMedia ?? null,
  );
  const [syncSources, setSyncSources] = useState(artist.syncSources);
  const [syncEnabled, setSyncEnabled] = useState(artist.syncEnabled);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState(artist.syncError);
  const [albums, setAlbums] = useState<AlbumDraft[]>(
      artist.albums.map((album) => ({
        title: album.title,
        spotify: album.links.spotify ?? "",
        appleMusic: album.links.appleMusic ?? "",
        youtubeMusic: album.links.youtubeMusic ?? "",
        isrc: album.isrc,
        platformIds: album.platformIds,
    })),
  );
  const [songs, setSongs] = useState<SongDraft[]>(artist.songs);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAlbum = () => {
    setAlbums((current) => [
      ...current,
      { title: "", spotify: "", appleMusic: "", youtubeMusic: "" },
    ]);
  };

  const updateAlbum = (index: number, patch: Partial<AlbumDraft>) => {
    setAlbums((current) =>
      current.map((album, i) =>
        i === index ? { ...album, ...patch } : album,
      ),
    );
  };

  const removeAlbum = (index: number) => {
    setAlbums((current) => current.filter((_, i) => i !== index));
  };

  const addSong = () => {
    setSongs((current) => [
      ...current,
      { title: "", releaseYear: "", type: "single", album: "" },
    ]);
  };

  const updateSong = (index: number, patch: Partial<SongDraft>) => {
    setSongs((current) =>
      current.map((song, i) =>
        i === index ? { ...song, ...patch } : song,
      ),
    );
  };

  const removeSong = (index: number) => {
    setSongs((current) => current.filter((_, i) => i !== index));
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const payload = {
      name,
      genre,
      tagline,
      shortBio,
      longBio,
    albums: albums
      .filter((album) => album.title.trim())
      .map((album) => ({
        title: album.title,
        links: {
          spotify: album.spotify || platformHomeUrls.spotify,
          appleMusic: album.appleMusic || platformHomeUrls.appleMusic,
          youtubeMusic: album.youtubeMusic || platformHomeUrls.youtubeMusic,
        },
        isrc: album.isrc,
        platformIds: album.platformIds,
      })),
      palette: { from: paletteFrom, to: paletteTo },
      songs: songs
        .filter((song) => song.title.trim())
        .map((song) => ({
          slug: song.slug,
          title: song.title,
          artistName: name,
          releaseYear: song.releaseYear,
          type: song.type,
          album: song.album || undefined,
          coverUrl: song.coverUrl,
          previewUrl: song.previewUrl,
          isrc: song.isrc,
          platformIds: song.platformIds,
          links: song.links,
        })),
      homeImage: homeImage || null,
      pageImage: pageImage || null,
      backdrop,
      hoverMedia,
      syncSources,
      syncEnabled,
    };
    const response = await fetch(
      artist.id ? `/api/admin/artists/${artist.id}` : "/api/admin/artists",
      {
        method: artist.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setBusy(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Save failed.");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  const syncNow = async () => {
    if (!artist.id) {
      setSyncStatus("Save the artist before starting a catalog sync.");
      return;
    }
    setSyncBusy(true);
    setSyncStatus("");
    const response = await fetch(`/api/admin/artists/${artist.id}/sync`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as {
      report?: {
        ok?: boolean;
        error?: string;
        addedSongs?: number;
        addedAlbums?: number;
        failedPlatforms?: string[];
        row?: {
          albums: {
            title: string;
            links?: {
              spotify?: string;
              appleMusic?: string;
              youtubeMusic?: string;
            };
            isrc?: string;
            platformIds?: {
              spotify?: string;
              appleMusic?: string;
              youtubeMusic?: string;
            };
          }[];
          songs: SongDraft[];
        };
      };
    };
    setSyncBusy(false);
    if (!response.ok || !data.report?.ok) {
      setSyncStatus(data.report?.error ?? "Catalog sync failed.");
      return;
    }
    const partial = data.report.failedPlatforms?.length
      ? ` Partial failure: ${data.report.failedPlatforms.join(", ")}.`
      : "";
    if (data.report.row) {
      setAlbums(
        data.report.row.albums.map((album) => ({
          title: album.title,
          spotify: album.links?.spotify ?? "",
          appleMusic: album.links?.appleMusic ?? "",
          youtubeMusic: album.links?.youtubeMusic ?? "",
          isrc: album.isrc,
          platformIds: album.platformIds,
        })),
      );
      setSongs(data.report.row.songs);
    }
    setSyncStatus(
      `Synced: ${data.report.addedSongs ?? 0} new track(s), ${data.report.addedAlbums ?? 0} new album(s).${partial}`,
    );
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
      <Link
        href="/admin"
        className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold uppercase tracking-[0.1em]">
        {artist.id ? "Edit artist" : "New artist"}
      </h1>

      <div className="mt-8 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Genre
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Amapiano"
              className={`mt-2 ${inputClass}`}
            />
          </label>
        </div>
        <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Tagline
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Amapiano, after hours"
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Short bio (home + sheet)
          <textarea
            value={shortBio}
            onChange={(e) => setShortBio(e.target.value)}
            rows={2}
            className={`mt-2 ${inputClass} resize-y leading-relaxed`}
          />
        </label>
        <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Full bio (artist page)
          <textarea
            value={longBio}
            onChange={(e) => setLongBio(e.target.value)}
            rows={6}
            className={`mt-2 ${inputClass} resize-y leading-relaxed`}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Palette — from
            <input
              type="color"
              value={paletteFrom}
              onChange={(e) => setPaletteFrom(e.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-foreground/15 bg-transparent"
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Palette — to
            <input
              type="color"
              value={paletteTo}
              onChange={(e) => setPaletteTo(e.target.value)}
              className="mt-2 h-10 w-full cursor-pointer rounded-xl border border-foreground/15 bg-transparent"
            />
          </label>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-yellow/25 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-yellow">
              Streaming profiles &amp; catalog sync
            </p>
            <p className="mt-2 max-w-[62ch] text-[11px] leading-relaxed opacity-55">
              These profile URLs appear beside the monochrome streaming logos on
              the artist page. Enabled artists are checked automatically every
              six hours. Spotify and Apple Music provide albums and tracks;
              YouTube Music contributes channel uploads as tracks.
            </p>
          </div>
          {artist.id && (
            <button
              type="button"
              onClick={() => void syncNow()}
              disabled={syncBusy}
              className="cursor-pointer rounded-full border border-yellow/40 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-yellow transition-colors hover:bg-yellow/10 disabled:opacity-50"
            >
              {syncBusy ? "Syncing…" : "Sync now"}
            </button>
          )}
        </div>
        <label className="mt-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] opacity-70">
          <input
            type="checkbox"
            checked={syncEnabled}
            onChange={(event) => setSyncEnabled(event.target.checked)}
            className="h-4 w-4 accent-yellow"
          />
          Enable automatic catalog sync
        </label>
        <div className="mt-4 grid gap-3">
          <label className="block text-[10px] uppercase tracking-[0.18em] opacity-50">
            Spotify artist profile URL
            <input
              value={syncSources.spotify ?? ""}
              onChange={(event) =>
                setSyncSources((current) => ({
                  ...current,
                  spotify: event.target.value,
                }))
              }
              placeholder="https://open.spotify.com/artist/..."
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.18em] opacity-50">
            Apple Music artist profile URL
            <input
              value={syncSources.appleMusic ?? ""}
              onChange={(event) =>
                setSyncSources((current) => ({
                  ...current,
                  appleMusic: event.target.value,
                }))
              }
              placeholder="https://music.apple.com/us/artist/..."
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className="block text-[10px] uppercase tracking-[0.18em] opacity-50">
            YouTube Music artist/channel URL
            <input
              value={syncSources.youtubeMusic ?? ""}
              onChange={(event) =>
                setSyncSources((current) => ({
                  ...current,
                  youtubeMusic: event.target.value,
                }))
              }
              placeholder="https://music.youtube.com/channel/..."
              className={`mt-2 ${inputClass}`}
            />
          </label>
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.14em] opacity-40">
          Last checked: {artist.lastSyncAttemptAt ?? "Never"}
        </p>
        {syncStatus && (
          <p className="mt-2 text-[11px] leading-relaxed text-yellow">
            {syncStatus}
          </p>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Media
        </p>
        <div className="mt-4 grid gap-6">
          <div className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Homepage image (the circle on the homepage)
            <div className="mt-2">
              <ImageUploadField
                value={homeImage}
                onChange={setHomeImage}
                placeholder="https://… or upload from device"
              />
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] opacity-50">
            Artist page portrait
            <div className="mt-2">
              <ImageUploadField
                value={pageImage}
                onChange={setPageImage}
                placeholder="https://… or upload from device"
              />
            </div>
          </div>
          <MediaRefUploadField
            label="Artist page backdrop (image or video)"
            value={backdrop ?? undefined}
            onChange={setBackdrop}
            hint="Fades behind the artist page. Remove it to go back to the default look."
          />
          <MediaRefUploadField
            label="Homepage hover media (image or video)"
            value={hoverMedia ?? undefined}
            onChange={setHoverMedia}
            hint="Shows on the homepage backdrop when hovering this artist."
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Albums
        </p>
        <div className="mt-3 flex flex-col gap-3">
          {albums.map((album, index) => (
            <div
              key={index}
              className="rounded-2xl border border-foreground/10 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
                  Album {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeAlbum(index)}
                  className="cursor-pointer rounded-md border border-red-400/30 px-2 py-0.5 text-[10px] text-red-400/80 hover:bg-red-400/10"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                <input
                  value={album.title}
                  onChange={(e) =>
                    updateAlbum(index, { title: e.target.value })
                  }
                  placeholder="Album title"
                  className={inputClass}
                />
                <input
                  value={album.spotify}
                  onChange={(e) =>
                    updateAlbum(index, { spotify: e.target.value })
                  }
                  placeholder="Spotify album link"
                  className={inputClass}
                />
                <input
                  value={album.appleMusic}
                  onChange={(e) =>
                    updateAlbum(index, { appleMusic: e.target.value })
                  }
                  placeholder="Apple Music album link"
                  className={inputClass}
                />
                <input
                  value={album.youtubeMusic}
                  onChange={(e) =>
                    updateAlbum(index, { youtubeMusic: e.target.value })
                  }
                  placeholder="YouTube Music album link"
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addAlbum}
            className="cursor-pointer self-start rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
          >
            + Album
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-foreground/10 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Tracks
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {songs.map((song, index) => (
            <li
              key={index}
              className="rounded-2xl border border-foreground/10 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
                  Track {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeSong(index)}
                  className="cursor-pointer rounded-md border border-red-400/30 px-2 py-0.5 text-[10px] text-red-400/80 hover:bg-red-400/10"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={song.title}
                  onChange={(e) =>
                    updateSong(index, { title: e.target.value })
                  }
                  placeholder="Track title"
                  className={inputClass}
                />
                <input
                  value={song.releaseYear}
                  onChange={(e) =>
                    updateSong(index, { releaseYear: e.target.value })
                  }
                  placeholder="Year (2026)"
                  className={inputClass}
                />
                <select
                  value={song.type}
                  onChange={(e) =>
                    updateSong(index, { type: e.target.value })
                  }
                  className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
                >
                  <option
                    value="single"
                    className="bg-background text-foreground"
                  >
                    Single
                  </option>
                  <option
                    value="album-track"
                    className="bg-background text-foreground"
                  >
                    Album track
                  </option>
                  <option
                    value="remix"
                    className="bg-background text-foreground"
                  >
                    Remix
                  </option>
                </select>
                <input
                  value={song.album ?? ""}
                  onChange={(e) =>
                    updateSong(index, { album: e.target.value })
                  }
                  placeholder="Album (if applicable)"
                  className={inputClass}
                />
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addSong}
          className="mt-3 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
        >
          + Track
        </button>
      </div>

      {error && <p className="mt-6 text-[12px] text-red-400">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-8 w-full cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save artist"}
      </button>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] opacity-40">
        Saving updates the homepage strip and creates /{name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}
      </p>
    </main>
  );
}
