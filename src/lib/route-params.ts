import { NextResponse } from "next/server";

/** Parse a route `:id` param. Returns null (caller should 400/404) unless
 *  the value is a positive integer, so garbage like "abc" or "1.5" never
 *  reaches the database layer as NaN. */
export function parseIdParam(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function invalidIdResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid id." }, { status: 400 });
}
