import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ChromeAutoHide } from "@/components/ChromeAutoHide";
import { PlatformCta } from "@/components/PlatformCta";
import { PlaylistCompactHero } from "@/components/PlaylistCompactHero";
import { PlaylistTracks, type PlaylistRow } from "@/components/PlaylistTracks";
import { PlaylistTopBar } from "@/components/PlaylistTopBar";
import { platformLabels, type Artist, type Platform, type Playlist } from "@/lib/data";
import { listArtists } from "@/lib/db";
import {
  getPlaylistBottomNavEnabled,
  getPlaylistStyleDesktop,
  getPlaylistStyleMobile,
  type PlaylistStyle,
} from "@/lib/sync-settings";
import { getCachedPublicPlaylist } from "@/lib/public-playlists";
import { syncStalePlaylists } from "@/lib/platforms/playlist-sync";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";

const platforms = Object.keys(platformLabels) as Platform[];

interface PlaylistPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PlaylistPageProps): Promise<Metadata> {
  const { slug } = await params;
  // Background refresh only — metadata serves the cache immediately.
  void syncStalePlaylists().catch(() => {});
  const playlist = isBackendConfigured()
    ? await fetchBackendJson<Playlist>(
        `/api/public/playlists/${encodeURIComponent(slug)}`,
      )
    : await getCachedPublicPlaylist(slug);
  if (!playlist) return {};
  const description = playlist.ogDescription ?? playlist.tagline;
  return {
    title: playlist.name,
    description,
    alternates: { canonical: `/playlists/${playlist.slug}` },
    openGraph: {
      title: playlist.name,
      description,
      url: `/playlists/${playlist.slug}`,
      type: "website",
      siteName: "Yellow White Noise",
      ...(playlist.ogImageUrl
        ? { images: [{ url: playlist.ogImageUrl }] }
        : {}),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { slug } = await params;
  let playlist: Playlist | undefined;
  let artists: Artist[] = [];
  let mobileStyle: PlaylistStyle = "full";
  let desktopStyle: PlaylistStyle = "full";
  let showBottomNav = false;
  if (isBackendConfigured()) {
    const [playlistData, homeData] = await Promise.all([
      fetchBackendJson<
        Playlist & {
          playlistStyle?: PlaylistStyle;
          playlistStyleMobile?: PlaylistStyle;
          playlistStyleDesktop?: PlaylistStyle;
        }
      >(`/api/public/playlists/${encodeURIComponent(slug)}`),
      fetchBackendJson<{ artists: Artist[] }>("/api/public/home"),
    ]);
    playlist = playlistData ?? undefined;
    artists = homeData?.artists ?? [];
    const legacy =
      playlistData?.playlistStyle === "compact" ? "compact" : "full";
    mobileStyle =
      playlistData?.playlistStyleMobile === "compact" ||
      playlistData?.playlistStyleMobile === "full"
        ? playlistData.playlistStyleMobile
        : legacy;
    desktopStyle =
      playlistData?.playlistStyleDesktop === "compact" ||
      playlistData?.playlistStyleDesktop === "full"
        ? playlistData.playlistStyleDesktop
        : legacy;
  } else {
  // Background refresh only — render serves the cache immediately.
  void syncStalePlaylists().catch(() => {});
  playlist = await getCachedPublicPlaylist(slug);
    artists = listArtists();
    mobileStyle = getPlaylistStyleMobile();
    desktopStyle = getPlaylistStyleDesktop();
    showBottomNav = getPlaylistBottomNavEnabled();
  }
  if (!playlist) notFound();

  const baseLinks = playlist.availableLinks ?? playlist.links;
  // Playlists stored before Amazon Music existed have no URL for it —
  // backfill the homepage default instead of hiding the button.
  const playlistLinks = {
    amazonMusic:
      playlist.links.amazonMusic ?? "https://music.amazon.com/",
    ...baseLinks,
  };
  const trackLinkMode =
    playlist.trackLinkMode === "playlist" ? "playlist" : "song";
  const renderHero = (heroStyle: PlaylistStyle) =>
    heroStyle === "compact" ? (
      <section className="mx-auto w-full max-w-2xl px-5 pt-8 md:px-10 md:pt-12">
        <PlaylistCompactHero
          name={playlist.name}
          tagline={playlist.tagline}
          description={playlist.description}
          links={playlistLinks}
          coverUrl={playlist.coverUrl}
          palette={playlist.coverPalette}
        />
      </section>
    ) : (
      <>
        <section className="mx-auto w-full max-w-5xl px-5 pt-10 md:px-10 md:pt-16">
          <div className="md:grid md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:items-center md:gap-12">
            <div
              className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-3xl shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]"
              style={{
                backgroundImage: playlist.coverUrl
                  ? `url(${playlist.coverUrl})`
                  : `linear-gradient(150deg, ${playlist.coverPalette.from}, ${playlist.coverPalette.to})`,
              }}
            >
              <div
                aria-hidden
                className="grain absolute inset-0 opacity-25 mix-blend-overlay"
              />
              <span className="absolute inset-0 flex items-center justify-center font-display text-[7rem] text-white/20">
                {playlist.name[0]}
              </span>
            </div>

            <div className="mt-8 md:mt-0">
              <p className="text-[11px] uppercase tracking-[0.28em] opacity-50">
                Yellow White Noise · Playlist
              </p>
                <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-[0.08em] [text-wrap:balance] break-words md:text-5xl">
                  {playlist.name}
                </h1>
              <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed opacity-70">
                {playlist.tagline}
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {platforms.map((platform) => {
                  const href = playlistLinks[platform];
                  if (!href) return null;
                  return (
                    <PlatformCta
                      key={platform}
                      platform={platform}
                      href={href}
                      entity={playlist.name}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-5 pt-14 md:px-10">
          <h2 className="text-[11px] uppercase tracking-[0.28em] opacity-50">
            About this playlist
          </h2>
          <p className="mt-4 max-w-[65ch] text-[15px] leading-relaxed opacity-80">
            {playlist.description}
          </p>
        </section>
      </>
    );
  const hero =
    mobileStyle === desktopStyle ? (
      renderHero(mobileStyle)
    ) : (
      <>
        <div className="md:hidden">{renderHero(mobileStyle)}</div>
        <div className="hidden md:block">{renderHero(desktopStyle)}</div>
      </>
    );

  const rows: PlaylistRow[] = playlist.entries.map((entry, index) => {
    if (entry.kind === "track") {
      const songSlug =
        entry.track.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `track-${index + 1}`;
      return {
        key: `track:imported:${index}:${songSlug}`,
        title: entry.track.title,
        artistName: entry.track.artistName,
        artistSlug: "imported",
        songSlug: `${songSlug}-${index + 1}`,
        links:
          trackLinkMode === "playlist"
            ? { ...playlistLinks }
            : {
                ...playlistLinks,
                ...entry.track.links,
              },
        previewUrl: entry.track.previewUrl,
        coverUrl: entry.track.coverUrl,
        palette: playlist.coverPalette,
      };
    }
    if (entry.kind === "label") {
      for (const artist of artists) {
        const song = artist.songs.find(
          (candidate) => candidate.slug === entry.songSlug,
        );
        if (song) {
          return {
            key: `track:${artist.slug}:${song.slug}`,
            title: song.title,
            artistName: song.artistName,
            artistSlug: artist.slug,
            songSlug: song.slug,
            links:
              trackLinkMode === "playlist" ? { ...playlistLinks } : song.links,
            previewUrl: song.previewUrl,
            coverUrl: song.coverUrl,
            palette: artist.palette,
          };
        }
      }
      return {
        key: `missing:${entry.songSlug}`,
        title: entry.songSlug,
        artistName: "",
        artistSlug: "missing",
        songSlug: entry.songSlug,
        links: { ...playlistLinks },
        palette: playlist.coverPalette,
      };
    }
    const songSlug = entry.track.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    return {
      key: `track:outside:${songSlug}`,
      title: entry.track.title,
      artistName: entry.track.artistName,
      artistSlug: "outside",
      songSlug,
      links:
        trackLinkMode === "playlist"
          ? { ...playlistLinks }
          : {
              spotify: entry.track.spotifyUrl ?? playlistLinks.spotify,
              appleMusic: playlistLinks.appleMusic,
              amazonMusic: playlistLinks.amazonMusic,
              youtubeMusic: playlistLinks.youtubeMusic,
            },
      palette: playlist.coverPalette,
    };
  });

  return (
    <>
      <ChromeAutoHide />
      <main className="min-h-dvh bg-background">
        <PlaylistTopBar
          playlistName={playlist.name}
          playlistSlug={playlist.slug}
        />
        {hero}
        <section
          className={`mx-auto w-full max-w-5xl px-5 md:px-10 ${
            mobileStyle === "compact" ? "pt-8" : "pt-12"
          }`}
        >
          <h2 className="text-[11px] uppercase tracking-[0.28em] opacity-50">
            Track preview
          </h2>
        <div className="mt-4">
          <PlaylistTracks rows={rows} trackLinkMode={trackLinkMode} />
        </div>
        </section>

        <div
          className={`flex justify-center px-5 pt-14 ${
            showBottomNav
              ? "pb-[max(env(safe-area-inset-bottom),6rem)]"
              : "pb-[max(env(safe-area-inset-bottom),2.5rem)]"
          }`}
        >
          <Link
            href="/playlists"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] underline underline-offset-8 opacity-80 transition-opacity hover:opacity-100"
          >
            View more playlists
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </main>
      {showBottomNav && <BottomNav />}
    </>
  );
}
