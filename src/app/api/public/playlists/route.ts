import { NextResponse } from "next/server";
import { getSetting } from "@/lib/db";
import { getCachedPublicPlaylists } from "@/lib/public-playlists";
import type { MediaRef } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  let backdrop: MediaRef | null = null;
  const raw = getSetting("home_backdrop");
  if (raw) {
    try {
      const value = JSON.parse(raw) as unknown;
      if (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        "src" in value &&
        (value.type === "image" || value.type === "video") &&
        typeof value.src === "string"
      ) {
        backdrop = value as MediaRef;
      }
    } catch {
      backdrop = null;
    }
  }
  return NextResponse.json({
    playlists: await getCachedPublicPlaylists(),
    backdrop,
  });
}
