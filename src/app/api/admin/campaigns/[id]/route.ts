import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteCampaign, getCampaignById, updateCampaign } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = getCampaignById(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    advertiser?: string;
    creativeType?: string;
    creativeHtml?: string;
    imageUrl?: string;
    linkUrl?: string;
    alt?: string;
    slots?: string[];
    targeting?: Record<string, string[]>;
    priority?: number;
    active?: boolean;
  };
  const campaign = updateCampaign(existing.id, {
    name: body.name ?? existing.name,
    advertiser: body.advertiser ?? existing.advertiser,
    creativeType:
      body.creativeType === "image" || body.creativeType === "html"
        ? body.creativeType
        : (existing.creative_type as "html" | "image"),
    creativeHtml: body.creativeHtml ?? existing.creative_html,
    imageUrl: body.imageUrl ?? existing.image_url,
    linkUrl: body.linkUrl ?? existing.link_url,
    alt: body.alt ?? existing.alt,
    slots: body.slots ?? JSON.parse(existing.slots),
    targeting: body.targeting ?? JSON.parse(existing.targeting),
    priority: body.priority ?? existing.priority,
    active: body.active ?? existing.active === 1,
  });
  return NextResponse.json(campaign);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  deleteCampaign(Number(id));
  return NextResponse.json({ ok: true });
}
