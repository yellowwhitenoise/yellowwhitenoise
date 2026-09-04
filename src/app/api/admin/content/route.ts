import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getSiteContent, setSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const content: SiteContent = {
    about:
      getSiteContent<SiteContent["about"]>("about") ??
      defaultSiteContent.about,
    contact:
      getSiteContent<SiteContent["contact"]>("contact") ??
      defaultSiteContent.contact,
    legal:
      getSiteContent<SiteContent["legal"]>("legal") ??
      defaultSiteContent.legal,
    socials:
      getSiteContent<SiteContent["socials"]>("socials") ??
      defaultSiteContent.socials,
  };
  return NextResponse.json(content);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    about?: { paragraphs?: string[] };
    contact?: { entries?: { label: string; email: string; note?: string }[] };
    legal?: { sections?: { id: string; heading: string; paragraphs: string[] }[] };
    socials?: { links?: { label: string; url: string }[] };
  };
  if (body.about?.paragraphs) setSiteContent("about", body.about);
  if (body.contact?.entries) setSiteContent("contact", body.contact);
  if (body.legal?.sections) setSiteContent("legal", body.legal);
  if (body.socials?.links) setSiteContent("socials", body.socials);
  return NextResponse.json({ ok: true });
}
