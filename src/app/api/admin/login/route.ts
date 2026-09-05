import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, createSession } from "@/lib/auth";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  let valid = false;
  try {
    valid = Boolean(
      body.email && body.password && checkCredentials(body.email, body.password),
    );
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured. Contact the site owner." },
      { status: 503 },
    );
  }
  if (!valid) {
    if (throttled(clientIp(request))) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
