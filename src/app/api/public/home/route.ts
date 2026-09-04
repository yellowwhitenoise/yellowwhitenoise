import { NextResponse } from "next/server";
import { getSetting, listArtists } from "@/lib/db";
import type { MediaRef } from "@/lib/data";

function readBackdrop(): MediaRef | null {
  const raw = getSetting("home_backdrop");
  if (!raw) return null;
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
      return value as MediaRef;
    }
  } catch {
    return null;
  }
  return null;
}

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ artists: listArtists(), backdrop: readBackdrop() });
}
