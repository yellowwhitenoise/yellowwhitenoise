import { NextResponse, type NextRequest } from "next/server";
import { listPublishedPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? undefined;
  const posts = listPublishedPosts(query).map((row) => ({
    slug: row.slug,
    title: row.title,
    brief: row.brief,
    date: row.date,
    heroImage: row.hero_image ?? undefined,
    heroPalette: { from: "#2a3f4d", to: "#101b23" },
  }));
  return NextResponse.json(posts);
}
