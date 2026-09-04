import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deletePlaylist, updatePlaylist } from "@/lib/db";
import { invalidatePublicPlaylists } from "@/lib/public-playlists";
import type { Platform } from "@/lib/data";

interface Params {
  params: Promise<{ id: string }>;
}

interface UpdateBody {
  name?: string;
  tagline?: string;
  description?: string;
  coverUrl?: string | null;
  links?: unknown;
  visible?: boolean;
  sortOrder?: number;
}

function parseLinks(value: unknown): Partial<Record<Platform, string>> {
  if (typeof value !== "object" || value === null) return {};
  const source = value as Record<string, unknown>;
  const links: Partial<Record<Platform, string>> = {};
  for (const platform of ["spotify", "appleMusic", "youtubeMusic"] as Platform[]) {
    const link = source[platform];
    if (typeof link === "string") links[platform] = link;
  }
  return links;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : undefined;
  const row = updatePlaylist(Number(id), {
    name: body.name,
    tagline: body.tagline,
    description: body.description,
    coverUrl: body.coverUrl,
    links: body.links === undefined ? undefined : parseLinks(body.links),
    visible: typeof body.visible === "boolean" ? body.visible : undefined,
    sortOrder,
  });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  invalidatePublicPlaylists();
  return NextResponse.json(row);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  deletePlaylist(Number(id));
  invalidatePublicPlaylists();
  return NextResponse.json({ ok: true });
}
