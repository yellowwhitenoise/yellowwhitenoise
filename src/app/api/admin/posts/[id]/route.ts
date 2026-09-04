import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  deletePost,
  getPostById,
  postInputFromApi,
  updatePost,
  type PostApiBody,
} from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = getPostById(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = (await request.json().catch(() => ({}))) as PostApiBody;
  const input = postInputFromApi(body, existing);
  const post = updatePost(existing.id, { ...input, slug: existing.slug });
  return NextResponse.json(post);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  deletePost(Number(id));
  return NextResponse.json({ ok: true });
}
