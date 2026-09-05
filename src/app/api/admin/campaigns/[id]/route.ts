import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { deleteCampaign, getCampaignById, updateCampaign } from "@/lib/db";
import { parseIdParam, invalidIdResponse } from "@/lib/route-params";
import { sanitizeRichHtml } from "@/lib/sanitize";

interface Params {
  params: Promise<{ id: string }>;
}

function parseJsonObject(raw: string): Record<string, string[]> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string[]>;
    }
  } catch {
    // Corrupt row — fall through to the empty default.
  }
  return {};
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const campaignId = parseIdParam(id);
  if (campaignId === null) return invalidIdResponse();
  const existing = getCampaignById(campaignId);
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
    creativeHtml:
      body.creativeHtml === undefined
        ? existing.creative_html
        : sanitizeRichHtml(body.creativeHtml),
    imageUrl: body.imageUrl ?? existing.image_url,
    linkUrl: body.linkUrl ?? existing.link_url,
    alt: body.alt ?? existing.alt,
    slots: body.slots ?? parseJsonArray(existing.slots),
    targeting: body.targeting ?? parseJsonObject(existing.targeting),
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
  const campaignId = parseIdParam(id);
  if (campaignId === null) return invalidIdResponse();
  deleteCampaign(campaignId);
  return NextResponse.json({ ok: true });
}
