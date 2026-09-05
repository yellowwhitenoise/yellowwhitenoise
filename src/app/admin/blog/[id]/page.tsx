import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPostById } from "@/lib/db";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { normalizeBlocks } from "@/lib/blocks";

export const dynamic = "force-dynamic";

/** Join a JSON-encoded string list; never throws on corrupt rows. */
function joinList(raw: string, separator: string): string {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return raw.startsWith("[") ? "" : raw;
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .join(separator);
  } catch {
    return raw.startsWith("[") ? "" : raw;
  }
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const post = getPostById(Number(id));
  if (!post) redirect("/admin");

  let parsedBlocks: unknown = [];
  try {
    parsedBlocks = JSON.parse(post.body);
  } catch {
    parsedBlocks = [];
  }

  return (
    <BlogEditor
      post={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        brief: post.brief,
        date: post.date,
        heroImage: post.hero_image ?? "",
        body: normalizeBlocks(parsedBlocks),
        status: post.status,
        excerpt: post.excerpt,
        category: post.category,
        tags: joinList(post.tags, ", "),
        author: post.author,
        publishedAt: post.published_at ?? "",
        seoTitle: post.seo_title ?? "",
        seoDescription: post.seo_description ?? "",
        primaryKeyword: post.primary_keyword,
        secondaryKeywords: joinList(post.secondary_keywords, ", "),
        searchIntent: post.search_intent,
        articleSummary: post.article_summary,
        keyTakeaways: joinList(post.key_takeaways, "\n"),
        directAnswer: post.direct_answer,
        keyFacts: joinList(post.key_facts, "\n"),
        entities: joinList(post.entities, ", "),
        topics: joinList(post.topics, ", "),
        editorialPerspective: post.editorial_perspective,
        faq: (() => {
          try {
            const parsed = JSON.parse(post.faq) as unknown;
            return Array.isArray(parsed)
              ? (parsed as { question: string; answer: string }[])
              : [];
          } catch {
            return [];
          }
        })(),
        sources: (() => {
          try {
            const parsed = JSON.parse(post.sources) as unknown;
            return Array.isArray(parsed)
              ? (parsed as {
                  url: string;
                  label: string;
                  publication?: string;
                  date?: string;
                  type?: string;
                }[])
              : [];
          } catch {
            return [];
          }
        })(),
        authorTitle: post.author_title,
        authorBio: post.author_bio,
        authorImage: post.author_image ?? "",
        authorLinks: (() => {
          try {
            const parsed = JSON.parse(post.author_links) as unknown;
            return Array.isArray(parsed)
              ? (parsed as { label: string; url: string }[])
              : [];
          } catch {
            return [];
          }
        })(),
        imageAlt: post.image_alt,
        relatedSlugs: joinList(post.related_slugs, ", "),
        materiallyUpdatedAt: post.materially_updated_at ?? "",
        reviewedAt: post.reviewed_at ?? "",
      }}
    />
  );
}
