import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createCampaign, listCampaigns } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listCampaigns());
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const campaign = createCampaign({
    name: body.name,
    advertiser: body.advertiser ?? "",
    creativeType: body.creativeType === "image" ? "image" : "html",
    creativeHtml: body.creativeHtml ?? "",
    imageUrl: body.imageUrl ?? "",
    linkUrl: body.linkUrl ?? "",
    alt: body.alt ?? "",
    slots: body.slots ?? [],
    targeting: body.targeting ?? {},
    priority: body.priority ?? 0,
    active: body.active ?? true,
  });
  return NextResponse.json(campaign);
}
