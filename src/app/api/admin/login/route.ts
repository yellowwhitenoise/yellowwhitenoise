import { NextResponse, type NextRequest } from "next/server";
import { checkCredentials, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  console.log(
    `[login-debug] email_len=${body.email?.length ?? -1} pw_len=${body.password?.length ?? -1} env_email_len=${process.env.ADMIN_EMAIL?.length ?? -1} env_pw_len=${process.env.ADMIN_PASSWORD?.length ?? -1}`,
  );
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
