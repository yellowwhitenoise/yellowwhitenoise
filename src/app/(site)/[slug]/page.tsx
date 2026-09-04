import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeClient from "@/components/HomeClient";
import { getArtistBySlug, getSetting, listArtists } from "@/lib/db";
import type { Artist, MediaRef } from "@/lib/data";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import { syncStaleArtists } from "@/lib/platforms/artist-sync";

interface ArtistRoutePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ArtistRoutePageProps): Promise<Metadata> {
  if (isBackendConfigured()) {
    const { slug: paramSlug } = await params;
    const data = await fetchBackendJson<{ artists: Artist[] }>(
      "/api/public/home",
    );
    const artist = data?.artists.find((entry) => entry.slug === paramSlug);
    if (!artist) return {};
    return {
      title: `${artist.name} — ${artist.genre}`,
      description: artist.shortBio,
      alternates: { canonical: `/${artist.slug}` },
      openGraph: {
        title: artist.name,
        description: artist.shortBio,
        url: `/${artist.slug}`,
        type: "website",
        siteName: "Yellow White Noise",
      },
    };
  }
  await syncStaleArtists();
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) return {};
  return {
    title: `${artist.name} — ${artist.genre}`,
    description: artist.shortBio,
    alternates: { canonical: `/${artist.slug}` },
    openGraph: {
      title: artist.name,
      description: artist.shortBio,
      url: `/${artist.slug}`,
      type: "website",
      siteName: "Yellow White Noise",
    },
  };
}

export default async function ArtistRoutePage({
  params,
}: ArtistRoutePageProps) {
  if (isBackendConfigured()) {
    const data = await fetchBackendJson<{
      artists: Artist[];
      backdrop: MediaRef | null;
    }>("/api/public/home");
    const { slug } = await params;
    const artist = data?.artists.find((entry) => entry.slug === slug);
    if (!artist) notFound();
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicGroup",
              name: artist.name,
              genre: artist.genre,
              url: `https://www.yellowwhitenoise.com/${artist.slug}`,
              description: artist.shortBio,
              sameAs: Object.values(artist.profileLinks),
            }),
          }}
        />
        <HomeClient
          artists={data?.artists ?? []}
          backdrop={data?.backdrop ?? undefined}
          initialSheet={artist.slug}
        />
      </>
    );
  }
  await syncStaleArtists();
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  if (!artist) notFound();

  const artists = listArtists();
  let backdrop: MediaRef | undefined;
  const raw = getSetting("home_backdrop");
  if (raw) {
    try {
      backdrop = JSON.parse(raw) as MediaRef;
    } catch {
      backdrop = undefined;
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MusicGroup",
            name: artist.name,
            genre: artist.genre,
            url: `https://www.yellowwhitenoise.com/${artist.slug}`,
            description: artist.shortBio,
            sameAs: Object.values(artist.profileLinks),
          }),
        }}
      />
      <HomeClient
        artists={artists}
        backdrop={backdrop}
        initialSheet={artist.slug}
      />
    </>
  );
}
