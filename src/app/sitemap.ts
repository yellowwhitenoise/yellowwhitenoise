import type { MetadataRoute } from "next";
import { listArtists, listPublishedPosts } from "@/lib/db";
import { getCachedPublicPlaylists } from "@/lib/public-playlists";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import type { Artist, Playlist } from "@/lib/data";
import type { BlogPost } from "@/lib/blog";

const SITE_URL = "https://www.yellowwhitenoise.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isBackendConfigured()) {
    const [posts, home, playlistData] = await Promise.all([
      fetchBackendJson<BlogPost[]>("/api/public/posts"),
      fetchBackendJson<{ artists: Artist[] }>("/api/public/home"),
      fetchBackendJson<{ playlists: Playlist[] }>("/api/public/playlists"),
    ]);
    const published = posts ?? [];
    const artists = home?.artists ?? [];
    const playlists = playlistData?.playlists ?? [];
    return [
      { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
      {
        url: `${SITE_URL}/playlists`,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      ...playlists.map((playlist) => ({
        url: `${SITE_URL}/playlists/${playlist.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
      { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
      { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
      { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
      ...published.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.4,
      })),
      ...artists.map((artist) => ({
        url: `${SITE_URL}/${artist.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.9,
      })),
    ];
  }
  const published = listPublishedPosts();
  const artists = listArtists();
  const playlists = await getCachedPublicPlaylists();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/playlists`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...playlists.map((playlist) => ({
      url: `${SITE_URL}/playlists/${playlist.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...published.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...artists.map((artist) => ({
      url: `${SITE_URL}/${artist.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
