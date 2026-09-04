import { NextResponse, type NextRequest } from "next/server";
import { getCachedPublicPlaylist } from "@/lib/public-playlists";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const playlist = await getCachedPublicPlaylist(slug);
  if (!playlist) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(playlist);
}
