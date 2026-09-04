import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/db";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export function GET() {
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
