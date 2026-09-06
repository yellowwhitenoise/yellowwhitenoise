import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { notifySubscribers, type NotifyType } from "@/lib/mailer";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/email-templates";
import type { Platform } from "@/lib/data";

function parseSubscriberIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is number =>
      typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

function parseHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 500);
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function parsePlatformLinks(value: unknown):
  | Partial<Record<Platform, string>>
  | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const source = value as Record<string, unknown>;
  const links: Partial<Record<Platform, string>> = {};
  for (const platform of ["spotify", "appleMusic", "amazonMusic", "youtubeMusic"] as Platform[]) {
    const url = parseHttpUrl(source[platform]);
    if (url) links[platform] = url;
  }
  return Object.keys(links).length > 0 ? links : undefined;
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    title?: string;
    artist?: string;
    url?: string;
    coverUrl?: string;
    platformLinks?: unknown;
    subscriberIds?: unknown;
  };
  const type = body.type as NotifyType;
  if (!body.title || !EMAIL_TEMPLATE_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error:
          "type (song|album|ep|comingSoonTrack|comingSoonAlbum|comingSoonEp|playlist|playlistTrack) and title are required",
      },
      { status: 400 },
    );
  }
  const selectedIds =
    body.subscriberIds === undefined
      ? undefined
      : parseSubscriberIds(body.subscriberIds);
  if (body.subscriberIds !== undefined && selectedIds?.length === 0) {
    return NextResponse.json(
      { error: "Select at least one active subscriber." },
      { status: 400 },
    );
  }
  const result = await notifySubscribers(type, {
    title: body.title,
    artist: body.artist,
    url: body.url,
    coverUrl: parseHttpUrl(body.coverUrl),
    platformLinks: parsePlatformLinks(body.platformLinks),
  }, selectedIds);
  return NextResponse.json(result);
}
