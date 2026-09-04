import { NextResponse, type NextRequest } from "next/server";
import {
  EMAIL_TEMPLATE_TYPES,
  type NotifyType,
} from "@/lib/email-templates";
import {
  getEmailTemplates,
  setEmailTemplate,
} from "@/lib/email-template-store";
import { isAdmin } from "@/lib/auth";

function isNotifyType(value: string): value is NotifyType {
  return EMAIL_TEMPLATE_TYPES.includes(value as NotifyType);
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ templates: getEmailTemplates() });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    type?: string;
    subject?: string;
    html?: string;
  };
  if (
    !body.type ||
    !isNotifyType(body.type) ||
    !body.subject?.trim() ||
    !body.html?.trim()
  ) {
    return NextResponse.json(
      { error: "type, subject, and html are required" },
      { status: 400 },
    );
  }
  if (body.subject.length > 240 || body.html.length > 100_000) {
    return NextResponse.json(
      { error: "Template is too long." },
      { status: 400 },
    );
  }
  setEmailTemplate(body.type, {
    subject: body.subject,
    html: body.html,
  });
  return NextResponse.json({ templates: getEmailTemplates() });
}
