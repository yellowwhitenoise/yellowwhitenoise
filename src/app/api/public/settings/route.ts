import { NextResponse } from "next/server";
import { getHapticsEnabled } from "@/lib/sync-settings";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ hapticsEnabled: getHapticsEnabled() });
}
