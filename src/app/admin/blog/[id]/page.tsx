import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getPostById } from "@/lib/db";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { normalizeBlocks } from "@/lib/blocks";

export const dynamic = "force-dynamic";

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
        tags: (() => {
          try {
            return (JSON.parse(post.tags) as string[]).join(", ");
          } catch {
            return post.tags;
          }
        })(),
        author: post.author,
        publishedAt: post.published_at ?? "",
        seoTitle: post.seo_title ?? "",
        seoDescription: post.seo_description ?? "",
        primaryKeyword: post.primary_keyword,
        secondaryKeywords: (() => {
          try {
            return (JSON.parse(post.secondary_keywords) as string[]).join(", ");
          } catch {
            return "";
          }
        })(),
        searchIntent: post.search_intent,
        articleSummary: post.article_summary,
        keyTakeaways: (() => {
          try {
            return (JSON.parse(post.key_takeaways) as string[]).join("\n");
          } catch {
            return "";
          }
        })(),
        directAnswer: post.direct_answer,
        keyFacts: (() => {
          try {
            return (JSON.parse(post.key_facts) as string[]).join("\n");
          } catch {
            return "";
          }
        })(),
        entities: (() => {
          try {
            return (JSON.parse(post.entities) as string[]).join(", ");
          } catch {
            return "";
          }
        })(),
        topics: (() => {
          try {
            return (JSON.parse(post.topics) as string[]).join(", ");
          } catch {
            return "";
          }
        })(),
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
        relatedSlugs: (() => {
          try {
            return (JSON.parse(post.related_slugs) as string[]).join(", ");
          } catch {
            return "";
          }
        })(),
        materiallyUpdatedAt: post.materially_updated_at ?? "",
        reviewedAt: post.reviewed_at ?? "",
      }}
    />
  );
}
