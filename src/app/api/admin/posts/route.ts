import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createPost, listAllPosts, postInputFromApi, type PostApiBody } from "@/lib/db";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(listAllPosts());
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as PostApiBody;
  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const baseSlug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug || "post"}-${Date.now().toString(36)}`;
  const input = postInputFromApi(body);
  const post = createPost({ ...input, slug });
  return NextResponse.json(post);
}
