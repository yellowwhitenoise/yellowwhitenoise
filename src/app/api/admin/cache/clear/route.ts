import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { clearCatalogCache } from "@/lib/platforms/resolve";
import { invalidatePublicPlaylists } from "@/lib/public-playlists";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cleared = clearCatalogCache();
  try {
    invalidatePublicPlaylists();
  } catch {
    // Cache invalidation is best effort; the short TTL is still safe.
  }
  return NextResponse.json({ ok: true, cleared });
}
