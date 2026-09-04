import { NextResponse, type NextRequest } from "next/server";
import { matchCampaign } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    slot?: string;
    category?: string;
    tags?: string[];
    device?: string;
    visitorType?: string;
    country?: string;
  };
  if (!body.slot) {
    return NextResponse.json({ error: "slot is required" }, { status: 400 });
  }
  const campaign = matchCampaign(body.slot, {
    category: body.category,
    tags: body.tags,
    device: body.device,
    visitorType: body.visitorType,
    country: body.country,
  });
  if (!campaign) {
    return NextResponse.json({ creative: null });
  }
  return NextResponse.json({
    creative:
      campaign.creative_type === "image"
        ? {
            creativeType: "image",
            imageUrl: campaign.image_url,
            linkUrl: campaign.link_url,
            alt: campaign.alt,
          }
        : {
            creativeType: "html",
            creativeHtml: campaign.creative_html,
          },
  });
}
