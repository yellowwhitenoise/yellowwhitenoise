import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  deleteSubscribers,
  listSubscribers,
  updateSubscriberStatus,
} from "@/lib/db";

function parseIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is number =>
      typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listSubscribers());
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    ids?: unknown;
    status?: string;
  };
  const ids = parseIds(body.ids);
  if (
    ids.length === 0 ||
    (body.status !== "active" && body.status !== "unsubscribed")
  ) {
    return NextResponse.json(
      { error: "ids and a valid status are required" },
      { status: 400 },
    );
  }
  updateSubscriberStatus(ids, body.status);
  return NextResponse.json(listSubscribers());
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = parseIds(body.ids);
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids are required" }, { status: 400 });
  }
  deleteSubscribers(ids);
  return NextResponse.json(listSubscribers());
}
