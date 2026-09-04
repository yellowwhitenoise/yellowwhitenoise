import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  createPlaylist,
  findPlaylistBySource,
  listPlaylistRows,
  refreshImportedPlaylist,
  type PlaylistInput,
} from "@/lib/db";
import { invalidatePublicPlaylists } from "@/lib/public-playlists";
import { importPlaylistFromUrl } from "@/lib/platforms/playlist-import";
import type { Platform } from "@/lib/data";

interface ImportBody {
  url?: string;
}

const palettes: Record<Platform, { from: string; to: string }> = {
  spotify: { from: "#2a3f4d", to: "#101b23" },
  appleMusic: { from: "#6c2131", to: "#241016" },
  youtubeMusic: { from: "#5a241c", to: "#1d0c09" },
};

function platformLabel(platform: Platform): string {
  if (platform === "appleMusic") return "Apple Music";
  if (platform === "youtubeMusic") return "YouTube Music";
  return "Spotify";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listPlaylistRows());
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as ImportBody;
  if (!body.url?.trim()) {
    return NextResponse.json(
      { error: "A playlist URL is required." },
      { status: 400 },
    );
  }
  try {
    const imported = await importPlaylistFromUrl(body.url);
    const palette = palettes[imported.platform];
    const links: Partial<Record<Platform, string>> = {
      [imported.platform]: imported.sourceUrl,
    };
    const input: PlaylistInput = {
      name: imported.name,
      tagline: `Curated on ${platformLabel(imported.platform)}`,
      description:
        imported.description ||
        `A Yellow White Noise playlist imported from ${platformLabel(imported.platform)}.`,
      coverUrl: imported.coverUrl ?? null,
      coverPaletteFrom: palette.from,
      coverPaletteTo: palette.to,
      links,
      entries: imported.tracks,
      sourcePlatform: imported.platform,
      sourceId: imported.sourceId,
      sourceUrl: imported.sourceUrl,
      visible: false,
      sortOrder: listPlaylistRows().length,
    };
    const existing = findPlaylistBySource(
      imported.platform,
      imported.sourceId,
    );
    if (existing) {
      const row = refreshImportedPlaylist(existing.id, input);
      invalidatePublicPlaylists();
      return NextResponse.json(row);
    }
    const row = createPlaylist(input);
    invalidatePublicPlaylists();
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Playlist import failed.",
      },
      { status: 400 },
    );
  }
}
