import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteArtist, getArtistById, updateArtist } from "@/lib/db";
import { parseIdParam, invalidIdResponse } from "@/lib/route-params";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const artistId = parseIdParam(id);
  if (artistId === null) return invalidIdResponse();
  const existing = getArtistById(artistId);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
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
    homeImage?: string | null;
    pageImage?: string | null;
    backdrop?: { type: "video" | "image"; src: string } | null;
    hoverMedia?: { type: "video" | "image"; src: string } | null;
    hoverBackdropEnabled?: boolean;
    profileLinks?: {
      spotify?: string;
      appleMusic?: string;
      amazonMusic?: string;
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

  const platformHomeUrls = {
    spotify: existing.profileLinks.spotify,
    appleMusic: existing.profileLinks.appleMusic,
    amazonMusic:
      existing.profileLinks.amazonMusic ?? "https://music.amazon.com/",
    youtubeMusic: existing.profileLinks.youtubeMusic,
  };

  const artist = updateArtist(existing.id, {
    slug: existing.slug,
    name: body.name ?? existing.name,
    genre: body.genre ?? existing.genre,
    tagline: body.tagline ?? existing.tagline,
    shortBio: body.shortBio ?? existing.shortBio,
    longBio: body.longBio ?? existing.longBio,
    albums: (body.albums ?? existing.albums).map((album) => ({
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
      from: body.palette?.from || existing.palette.from,
      to: body.palette?.to || existing.palette.to,
    },
    profileLinks: {
      ...existing.profileLinks,
      ...(body.syncSources ?? {}),
      ...(body.profileLinks ?? {}),
    },
    songs: (body.songs ?? existing.songs).map((song) => ({
      slug:
        song.slug ||
        song.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      title: song.title,
      artistName: existing.name,
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
    homeImage:
      body.homeImage === undefined ? existing.homeImage : body.homeImage,
    pageImage:
      body.pageImage === undefined ? existing.pageImage : body.pageImage,
    backdrop:
      body.backdrop === undefined ? existing.backdrop : body.backdrop,
    hoverMedia:
      body.hoverMedia === undefined ? existing.hoverMedia : body.hoverMedia,
    hoverBackdropEnabled:
      body.hoverBackdropEnabled === undefined
        ? existing.hoverBackdropEnabled
        : body.hoverBackdropEnabled,
    syncSources:
      body.syncSources === undefined
        ? existing.syncSources
        : body.syncSources,
    syncEnabled:
      body.syncEnabled === undefined ? existing.syncEnabled : body.syncEnabled,
  });
  return NextResponse.json(artist);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const artistId = parseIdParam(id);
  if (artistId === null) return invalidIdResponse();
  deleteArtist(artistId);
  return NextResponse.json({ ok: true });
}
