import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getPublicPostBySlug,
  getRelatedPosts,
  getSetting,
  type BlogPostRow,
  type FaqItem,
  type SourceItem,
  type AuthorLink,
} from "@/lib/db";
import { BlogBlocks } from "@/components/BlogBlocks";
import { fetchBackendJson, isBackendConfigured } from "@/lib/backend-fetch";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.yellowwhitenoise.com";

function parseList(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value.includes("T") || value.includes("Z") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toIso(value?: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(
    value.includes("T") || value.includes("Z")
      ? value
      : `${value.replace(" ", "T")}Z`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

type PostDetail = {
  post: BlogPostRow;
  related: BlogPostRow[];
  autoAds: boolean;
  preferredSourcesUrl: string | null;
};

async function getPostDetail(slug: string): Promise<PostDetail | null> {
  if (isBackendConfigured()) {
    const data = await fetchBackendJson<{
      post: BlogPostRow;
      related: BlogPostRow[];
      autoAds: boolean;
      preferredSourcesUrl: string | null;
    }>(`/api/public/posts/${encodeURIComponent(slug)}`);
    if (!data?.post) return null;
    return data;
  }
  const post = getPublicPostBySlug(slug);
  if (!post) return null;
  const tags = parseList(post.tags);
  const entities = parseList(post.entities);
  const manualRelated = parseList(post.related_slugs)
    .map((relatedSlug) => getPostBySlug(relatedSlug))
    .filter(
      (row): row is NonNullable<typeof row> =>
        Boolean(row) &&
        (row!.status === "published" ||
          (row!.status === "scheduled" &&
            Boolean(row!.published_at) &&
            row!.published_at! <= new Date().toISOString().replace("T", " ").slice(0, 19))),
    );
  const autoRelated = getRelatedPosts(post.slug, post.category, tags, entities);
  const related = [
    ...new Map(
      [...manualRelated, ...autoRelated].map((row) => [row.slug, row]),
    ).values(),
  ]
    .filter((row) => row.slug !== post.slug)
    .slice(0, 3);
  return {
    post,
    related,
    autoAds: getSetting("auto_ads") !== "false",
    preferredSourcesUrl: getSetting("google_preferred_sources_url"),
  };
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getPostDetail(slug);
  if (!detail) return {};
  const post = detail.post;
  const tags = parseList(post.tags);
  const secondaryKeywords = parseList(post.secondary_keywords);
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.brief,
    keywords: [
      ...(post.primary_keyword ? [post.primary_keyword] : []),
      ...secondaryKeywords,
      ...tags,
    ],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.brief,
      url: `/blog/${post.slug}`,
      type: "article",
      siteName: "Yellow White Noise",
      publishedTime: toIso(post.published_at) ?? undefined,
      modifiedTime:
        toIso(post.materially_updated_at ?? post.updated_at) ?? undefined,
      authors: [post.author],
      tags: [...tags, ...parseList(post.entities)],
      images:
        post.featured_image || post.hero_image
          ? [{ url: (post.featured_image || post.hero_image)! }]
          : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const detail = await getPostDetail(slug);
  if (!detail) notFound();
  const { post, related, autoAds, preferredSourcesUrl } = detail;

  const tags = parseList(post.tags);
  const entities = parseList(post.entities);
  const topics = parseList(post.topics);
  const keyTakeaways = parseList(post.key_takeaways);
  let faq: FaqItem[] = [];
  try {
    faq = JSON.parse(post.faq) as FaqItem[];
  } catch {
    faq = [];
  }
  faq = faq.filter((entry) => entry.question && entry.answer);
  let sources: SourceItem[] = [];
  try {
    sources = JSON.parse(post.sources) as SourceItem[];
  } catch {
    sources = [];
  }
  sources = sources.filter((entry) => entry.url);
  let authorLinks: AuthorLink[] = [];
  try {
    authorLinks = JSON.parse(post.author_links) as AuthorLink[];
  } catch {
    authorLinks = [];
  }

  const publishedIso = toIso(post.published_at);
  const modifiedIso =
    toIso(post.materially_updated_at ?? post.updated_at) ?? publishedIso;
  const imageUrl = post.featured_image || post.hero_image;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.brief,
    ...(imageUrl
      ? {
          image: [
            imageUrl.startsWith("http") ? imageUrl : `${SITE_URL}${imageUrl}`,
          ],
        }
      : {}),
    datePublished: publishedIso ?? undefined,
    dateModified: modifiedIso ?? undefined,
    author: {
      "@type": "Person",
      name: post.author,
      ...(post.author_title ? { jobTitle: post.author_title } : {}),
      ...(post.author_bio ? { description: post.author_bio } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Yellow White Noise",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    keywords: [
      ...(post.primary_keyword ? [post.primary_keyword] : []),
      ...parseList(post.secondary_keywords),
      ...tags,
    ].join(", "),
    ...(topics.length > 0
      ? { articleSection: topics, about: topics.map((topic) => ({ "@type": "Thing", name: topic })) }
      : {}),
    ...(entities.length > 0
      ? { mentions: entities.map((entity) => ({ "@type": "Thing", name: entity })) }
      : {}),
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-2xl overflow-x-clip px-5 pb-36 pt-24 md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-gradient-to-t from-background to-transparent"
      />
      <Link
        href="/blog"
        className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
      >
        ← Blog
      </Link>
      {post.category && (
        <p className="mt-6 text-[10px] uppercase tracking-[0.24em] text-yellow">
          {post.category}
        </p>
      )}
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-[10px] uppercase tracking-[0.2em] opacity-40">
        {[
          formatDate(post.published_at ?? post.date) ??
            (post.date ? `Published ${post.date}` : null),
          post.materially_updated_at
            ? `Updated ${formatDate(post.materially_updated_at)}`
            : null,
          post.reviewed_at ? `Reviewed ${formatDate(post.reviewed_at)}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] opacity-60">
        By {post.author}
        {post.author_title ? ` — ${post.author_title}` : ""}
      </p>

      {(post.featured_image || post.hero_image) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={(post.featured_image || post.hero_image)!}
          alt={post.image_alt || post.title}
          className="mt-8 aspect-video w-full rounded-2xl object-cover"
        />
      )}

      {post.direct_answer && (
        <section className="mt-8 rounded-2xl border border-yellow/25 bg-yellow/[0.04] p-5">
          <h2 className="text-[10px] uppercase tracking-[0.24em] text-yellow">
            Quick answer
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed">
            {post.direct_answer}
          </p>
        </section>
      )}

      {keyTakeaways.length > 0 && (
        <section className="mt-6 rounded-2xl border border-foreground/10 p-5">
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-50">
            Key takeaways
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed">
            {keyTakeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <BlogBlocks
          rawBlocks={post.body}
          autoAds={autoAds}
          category={post.category}
          tags={tags}
        />
      </div>

      {faq.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Frequently asked questions</h2>
          {faq.map((entry) => (
            <div key={entry.question} className="mt-6">
              <h3 className="text-[15px] font-semibold">{entry.question}</h3>
              <p className="mt-2 text-[13px] leading-relaxed opacity-80">
                {entry.answer}
              </p>
            </div>
          ))}
        </section>
      )}

      {sources.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-semibold">Sources</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[12px] leading-relaxed opacity-75">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-yellow"
                >
                  {source.label || source.publication || source.url}
                </a>
                {(source.publication || source.date) && (
                  <span className="opacity-60">
                    {" "}
                    — {[source.publication, source.date].filter(Boolean).join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(tags.length > 0 || entities.length > 0) && (
        <div className="mt-10 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-foreground/15 px-3 py-1 text-[10px] uppercase tracking-[0.16em] opacity-60"
            >
              {tag}
            </span>
          ))}
          {entities.map((entity) => (
            <Link
              key={entity}
              href={`/blog?search=${encodeURIComponent(entity)}`}
              className="rounded-full border border-yellow/30 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-yellow/90 transition-colors hover:bg-yellow/10"
            >
              {entity}
            </Link>
          ))}
        </div>
      )}

      {(post.author_bio || post.author_image || authorLinks.length > 0) && (
        <section className="mt-12 flex gap-4 rounded-2xl border border-foreground/10 p-5">
          {post.author_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author_image}
              alt={post.author}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              {post.author}
              {post.author_title ? (
                <span className="ml-2 font-normal normal-case tracking-normal opacity-50">
                  {post.author_title}
                </span>
              ) : null}
            </p>
            {post.editorial_perspective && (
              <p className="mt-1.5 text-[11px] italic leading-relaxed opacity-60">
                Editor&apos;s note: {post.editorial_perspective}
              </p>
            )}
            {post.author_bio && (
              <p className="mt-1.5 text-[12px] leading-relaxed opacity-70">
                {post.author_bio}
              </p>
            )}
            {authorLinks.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-3">
                {authorLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-[0.18em] underline underline-offset-4 hover:text-yellow"
                  >
                    {link.label || link.url}
                  </a>
                ))}
              </p>
            )}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-50">
            You might also like
          </h2>
          <ul className="mt-4 grid gap-3">
            {related.map((row) => (
              <li key={row.slug}>
                <Link
                  href={`/blog/${row.slug}`}
                  className="block rounded-2xl border border-foreground/10 p-4 transition-colors hover:border-yellow/40"
                >
                  <p className="text-[13px] font-medium leading-snug">
                    {row.title}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-40">
                    {[row.category, row.date].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {preferredSourcesUrl && (
        <div className="mt-10 flex justify-center">
          <a
            href={preferredSourcesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-foreground/20 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10"
          >
            Follow Yellow White Noise on Google
          </a>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
