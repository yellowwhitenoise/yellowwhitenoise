import type { Metadata } from "next";
import { InfoSections } from "@/components/InfoSections";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { listPublishedPosts } from "@/lib/db";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";
import type { BlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes from Yellow White Noise — on Amapiano, Afrobeats, sequencing playlists and writing rhythm.",
  alternates: { canonical: "/blog" },
  openGraph: { url: "/blog", title: "Blog" },
};

export default async function BlogPage() {
  if (isBackendConfigured()) {
    const [posts, content] = await Promise.all([
      fetchBackendJson<BlogPost[]>("/api/public/posts"),
      fetchBackendJson<SiteContent>("/api/public/site-content"),
    ]);
    return (
      <InfoSections
        initialSection="blog"
        initialPosts={posts ?? []}
        content={content ?? defaultSiteContent}
      />
    );
  }
  const posts = listPublishedPosts().map((row) => ({
    slug: row.slug,
    title: row.title,
    brief: row.brief,
    date: row.date,
    heroImage: row.hero_image ?? undefined,
    heroPalette: { from: "#2a3f4d", to: "#101b23" },
  }));

  const content: SiteContent = {
    about:
      getSiteContent<SiteContent["about"]>("about") ??
      defaultSiteContent.about,
    contact:
      getSiteContent<SiteContent["contact"]>("contact") ??
      defaultSiteContent.contact,
    legal:
      getSiteContent<SiteContent["legal"]>("legal") ??
      defaultSiteContent.legal,
  };

  return <InfoSections initialSection="blog" initialPosts={posts} content={content} />;
}
