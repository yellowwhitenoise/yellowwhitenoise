import { NextResponse, type NextRequest } from "next/server";
import { removePushSubscription } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    endpoint?: unknown;
  };
  if (typeof body.endpoint === "string" && body.endpoint) {
    removePushSubscription(body.endpoint);
  }
  return NextResponse.json({ ok: true });
}
