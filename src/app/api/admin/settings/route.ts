import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  setSetting,
} from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ enabled: getNotificationsEnabled() });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    enabled?: boolean;
    key?: string;
    value?: string;
  };
  if (typeof body.enabled === "boolean") {
    setNotificationsEnabled(body.enabled);
  }
  if (body.key) {
    setSetting(body.key, String(body.value ?? ""));
  }
  return NextResponse.json({ enabled: getNotificationsEnabled() });
}
