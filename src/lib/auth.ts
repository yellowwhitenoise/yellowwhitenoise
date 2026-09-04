import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ywn_admin";
const SESSION_DAYS = 7;

function secret(): string {
  return process.env.AUTH_SECRET || "ywn-dev-secret-change-me";
}

function adminEmail(): string {
  return process.env.ADMIN_EMAIL || "admin@yellowwhitenoise.com";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "ywn-admin-2026";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(): string {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expiry, signature] = parts;
  const payload = `${role}.${expiry}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return Number(expiry) > Date.now();
}

export function checkCredentials(
  email: string,
  password: string,
): boolean {
  const expectedEmail = adminEmail();
  const expectedPassword = adminPassword();
  const emailOk =
    email.length === expectedEmail.length &&
    timingSafeEqual(Buffer.from(email), Buffer.from(expectedEmail));
  const passwordOk =
    password.length === expectedPassword.length &&
    timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));
  return emailOk && passwordOk;
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}
