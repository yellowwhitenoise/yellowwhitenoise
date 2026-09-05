import { NextResponse, type NextRequest } from "next/server";
import {
  getPostBySlug,
  getPublicPostBySlug,
  getRelatedPosts,
  getSetting,
  isPubliclyVisible,
  type BlogPostRow,
} from "@/lib/db";

export const dynamic = "force-dynamic";

function parseStringList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPublicPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tags = parseStringList(post.tags);
  const entities = parseStringList(post.entities);
  const manualRelated = parseStringList(post.related_slugs)
    .map((relatedSlug) => getPostBySlug(relatedSlug))
    .filter(
      (row): row is BlogPostRow =>
        row !== undefined && isPubliclyVisible(row),
    );
  const autoRelated = getRelatedPosts(post.slug, post.category, tags, entities);
  const related = [
    ...new Map(
      [...manualRelated, ...autoRelated].map((row) => [row.slug, row]),
    ).values(),
  ]
    .filter((row) => row.slug !== post.slug)
    .slice(0, 3);
  return NextResponse.json({
    post,
    related,
    autoAds: getSetting("auto_ads") !== "false",
    preferredSourcesUrl: getSetting("google_preferred_sources_url"),
  });
}
