import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { notifySubscribers, type NotifyType } from "@/lib/mailer";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/email-templates";

function parseSubscriberIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is number =>
      typeof id === "number" && Number.isInteger(id) && id > 0,
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    title?: string;
    artist?: string;
    url?: string;
    subscriberIds?: unknown;
  };
  const type = body.type as NotifyType;
  if (!body.title || !EMAIL_TEMPLATE_TYPES.includes(type)) {
    return NextResponse.json(
      {
        error:
          "type (song|album|ep|playlist|playlistTrack) and title are required",
      },
      { status: 400 },
    );
  }
  const selectedIds =
    body.subscriberIds === undefined
      ? undefined
      : parseSubscriberIds(body.subscriberIds);
  if (body.subscriberIds !== undefined && selectedIds?.length === 0) {
    return NextResponse.json(
      { error: "Select at least one active subscriber." },
      { status: 400 },
    );
  }
  const result = await notifySubscribers(type, {
    title: body.title,
    artist: body.artist,
    url: body.url,
  }, selectedIds);
  return NextResponse.json(result);
}
