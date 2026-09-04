import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  if (
    !body.email ||
    !body.password ||
    !checkCredentials(body.email, body.password)
  ) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
