import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createArtist, listArtists } from "@/lib/db";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "artist"
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listArtists());
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    genre?: string;
    tagline?: string;
    shortBio?: string;
    longBio?: string;
    albums?: {
      title: string;
      kind?: string;
      links?: {
        spotify?: string;
        appleMusic?: string;
        amazonMusic?: string;
        youtubeMusic?: string;
      };
      isrc?: string;
      platformIds?: {
        spotify?: string;
        appleMusic?: string;
        youtubeMusic?: string;
      };
    }[];
    palette?: { from?: string; to?: string };
    songs?: {
      slug?: string;
      title: string;
      releaseYear?: string;
      type?: string;
      album?: string;
      coverUrl?: string;
      previewUrl?: string;
      isrc?: string;
      links?: {
        spotify?: string;
        appleMusic?: string;
        amazonMusic?: string;
        youtubeMusic?: string;
      };
      platformIds?: {
        spotify?: string;
        appleMusic?: string;
        youtubeMusic?: string;
      };
    }[];
    homeImage?: string;
    pageImage?: string;
    backdrop?: { type: "video" | "image"; src: string } | null;
    hoverMedia?: { type: "video" | "image"; src: string } | null;
    hoverBackdropEnabled?: boolean;
    profileLinks?: {
      spotify?: string;
      appleMusic?: string;
      youtubeMusic?: string;
      youtube?: string;
    };
    syncSources?: {
      spotify?: string;
      appleMusic?: string;
      youtubeMusic?: string;
    };
    syncEnabled?: boolean;
  };
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const artistName = body.name;
  const platformHomeUrls = {
    spotify: "https://open.spotify.com/",
    appleMusic: "https://music.apple.com/",
    amazonMusic: "https://music.amazon.com/",
    youtubeMusic: "https://music.youtube.com/",
    youtube: "https://www.youtube.com/",
  };
  const artist = createArtist({
    slug: slugify(body.name),
    name: body.name,
    genre: body.genre ?? "",
    tagline: body.tagline ?? "",
    shortBio: body.shortBio ?? "",
    longBio: body.longBio ?? "",
    albums: (body.albums ?? []).map((album) => ({
      title: album.title,
        kind: album.kind === "ep" ? "ep" : "album",
        links: {
          spotify: album.links?.spotify || platformHomeUrls.spotify,
          appleMusic: album.links?.appleMusic || platformHomeUrls.appleMusic,
          amazonMusic: album.links?.amazonMusic || platformHomeUrls.amazonMusic,
          youtubeMusic: album.links?.youtubeMusic || platformHomeUrls.youtubeMusic,
        },
        isrc: album.isrc,
        platformIds: album.platformIds,
    })),
    palette: {
      from: body.palette?.from || "#2a3f4d",
      to: body.palette?.to || "#101b23",
    },
    profileLinks: {
      ...platformHomeUrls,
      ...(body.syncSources ?? {}),
      ...(body.profileLinks ?? {}),
    },
    songs: (body.songs ?? []).map((song) => ({
      slug: song.slug || slugify(song.title),
      title: song.title,
      artistName,
      releaseYear: song.releaseYear ?? "",
      type: (song.type as "single" | "album-track" | "remix") ?? "single",
      album: song.album,
      coverUrl: song.coverUrl,
      previewUrl: song.previewUrl,
      isrc: song.isrc,
      platformIds: song.platformIds,
      links: {
        spotify: song.links?.spotify || platformHomeUrls.spotify,
        appleMusic: song.links?.appleMusic || platformHomeUrls.appleMusic,
        amazonMusic: song.links?.amazonMusic || platformHomeUrls.amazonMusic,
        youtubeMusic: song.links?.youtubeMusic || platformHomeUrls.youtubeMusic,
      },
    })),
    homeImage: body.homeImage ?? null,
    pageImage: body.pageImage ?? null,
    backdrop: body.backdrop ?? null,
    hoverMedia: body.hoverMedia ?? null,
    hoverBackdropEnabled: body.hoverBackdropEnabled ?? true,
    syncSources: body.syncSources ?? {},
    syncEnabled: body.syncEnabled ?? false,
  });
  return NextResponse.json(artist);
}
