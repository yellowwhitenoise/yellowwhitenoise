"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlockEditor } from "@/components/admin/BlockEditor";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { BlogBlock } from "@/lib/blocks";

interface EditorPost {
  id?: number;
  title: string;
  brief: string;
  date: string;
  heroImage: string;
  body: BlogBlock[];
  status: string;
  excerpt: string;
  category: string;
  tags: string;
  author: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  searchIntent: string;
  articleSummary: string;
  keyTakeaways: string;
  directAnswer: string;
  keyFacts: string;
  entities: string;
  topics: string;
  editorialPerspective: string;
  faq: { question: string; answer: string }[];
  sources: {
    url: string;
    label: string;
    publication?: string;
    date?: string;
    type?: string;
  }[];
  authorTitle: string;
  authorBio: string;
  authorImage: string;
  authorLinks: { label: string; url: string }[];
  imageAlt: string;
  relatedSlugs: string;
  materiallyUpdatedAt: string;
  reviewedAt: string;
  slug?: string;
}

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow";

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function BlogEditor({ post }: { post: EditorPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [brief, setBrief] = useState(post.brief);
  const [date, setDate] = useState(post.date);
  const [heroImage, setHeroImage] = useState(post.heroImage);
  const [blocks, setBlocks] = useState<BlogBlock[]>(post.body);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [category, setCategory] = useState(post.category);
  const [tags, setTags] = useState(post.tags);
  const [author, setAuthor] = useState(post.author);
  const [publishedAt, setPublishedAt] = useState(post.publishedAt);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle);
  const [seoDescription, setSeoDescription] = useState(post.seoDescription);
  const [primaryKeyword, setPrimaryKeyword] = useState(post.primaryKeyword);
  const [secondaryKeywords, setSecondaryKeywords] = useState(
    post.secondaryKeywords,
  );
  const [searchIntent, setSearchIntent] = useState(post.searchIntent);
  const [articleSummary, setArticleSummary] = useState(post.articleSummary);
  const [keyTakeaways, setKeyTakeaways] = useState(post.keyTakeaways);
  const [directAnswer, setDirectAnswer] = useState(post.directAnswer);
  const [keyFacts, setKeyFacts] = useState(post.keyFacts);
  const [entities, setEntities] = useState(post.entities);
  const [topics, setTopics] = useState(post.topics);
  const [editorialPerspective, setEditorialPerspective] = useState(
    post.editorialPerspective,
  );
  const [faq, setFaq] = useState(
    Array.isArray(post.faq) ? post.faq : [],
  );
  const [sources, setSources] = useState(
    Array.isArray(post.sources) ? post.sources : [],
  );
  const [authorTitle, setAuthorTitle] = useState(post.authorTitle);
  const [authorBio, setAuthorBio] = useState(post.authorBio);
  const [authorImage, setAuthorImage] = useState(post.authorImage);
  const [authorLinks, setAuthorLinks] = useState(
    Array.isArray(post.authorLinks) ? post.authorLinks : [],
  );
  const [imageAlt, setImageAlt] = useState(post.imageAlt);
  const [relatedSlugs, setRelatedSlugs] = useState(post.relatedSlugs);
  const [materiallyUpdatedAt, setMateriallyUpdatedAt] = useState(
    post.materiallyUpdatedAt,
  );
  const [reviewedAt, setReviewedAt] = useState(post.reviewedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const save = async (action: "draft" | "publish" | "schedule") => {
    setBusy(true);
    setError(null);
    setNotice(null);
    const status =
      action === "publish"
        ? "published"
        : action === "schedule"
          ? "scheduled"
          : "draft";
    const payload = {
      title,
      brief,
      date,
      heroImage: heroImage || null,
      body: blocks,
      status,
      excerpt,
      category,
      tags,
      author,
      publishedAt:
        action === "schedule" || status === "scheduled"
          ? publishedAt || null
          : action === "publish"
            ? new Date().toISOString()
            : null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      primaryKeyword,
      secondaryKeywords,
      searchIntent,
      articleSummary,
      keyTakeaways,
      directAnswer,
      keyFacts,
      entities,
      topics,
      editorialPerspective,
      faq,
      sources,
      authorTitle,
      authorBio,
      authorImage: authorImage || null,
      authorLinks,
      imageAlt,
      relatedSlugs,
      materiallyUpdatedAt: materiallyUpdatedAt || null,
      reviewedAt: reviewedAt || null,
    };
    const response = await fetch(
      post.id ? `/api/admin/posts/${post.id}` : "/api/admin/posts",
      {
        method: post.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setBusy(false);
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(data.error ?? "Save failed.");
      return;
    }
    if (action === "publish") {
      router.push("/admin");
      router.refresh();
    } else {
      setNotice(
        action === "schedule"
          ? "Scheduled. It goes live automatically at the chosen time."
          : "Draft saved.",
      );
      if (!post.id) {
        router.refresh();
      }
    }
  };

  const labelClass = "block text-[10px] uppercase tracking-[0.22em] opacity-50";

  const h2Count = blocks.filter((block) => block.type === "heading" && block.level === 2).length;
  const effectiveDescription = seoDescription || brief;
  const answerWords = wordCount(directAnswer);

  const audit: { item: string; ok: boolean }[] = [
    { item: "Title length (30+ characters)", ok: title.length >= 30 },
    { item: "Meta description 50–160 characters", ok: effectiveDescription.length >= 50 && effectiveDescription.length <= 160 },
    { item: "Direct answer present", ok: answerWords > 0 },
    { item: "Direct answer 40–100 words", ok: answerWords >= 40 && answerWords <= 100 },
    { item: "H2 structure (at least 2 sections)", ok: h2Count >= 2 },
    { item: "Primary keyword", ok: Boolean(primaryKeyword) },
    { item: "Entities tagged", ok: entities.trim().length > 0 },
    { item: "Key takeaways", ok: keyTakeaways.trim().length > 0 },
    { item: "Key facts", ok: keyFacts.trim().length > 0 },
    { item: "Related questions (FAQ)", ok: faq.some((entry) => entry.question && entry.answer) },
    { item: "Sources cited", ok: sources.some((entry) => entry.url) },
    { item: "Author name and bio", ok: Boolean(author) && Boolean(authorBio) },
    { item: "Featured image alt text", ok: Boolean(imageAlt) },
    { item: "Related articles", ok: Boolean(relatedSlugs) || h2Count >= 2 },
  ];
  const auditPassed = audit.filter((entry) => entry.ok).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
        >
          ← Dashboard
        </Link>
        {post.slug && (
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-35">
            /{post.slug}
          </p>
        )}
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold uppercase tracking-[0.1em]">
        {post.id ? "Edit post" : "New post"}
      </h1>

      <div className="mt-8 grid gap-4">
        <label className={labelClass}>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <label className={labelClass}>
          Listing brief
          <input
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Display date
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Aug 14, 2026"
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className={labelClass}>
            Author
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </label>
        </div>
        <div className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
          Featured image
          <div className="mt-2">
            <ImageUploadField
              value={heroImage}
              onChange={setHeroImage}
              placeholder="https://… or upload from device"
            />
          </div>
        </div>
        <label className={labelClass}>
          Image alt text (accessibility + image search)
          <input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Describe what the image shows"
            className={`mt-2 ${inputClass}`}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Music"
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className={labelClass}>
            Tags (comma-separated)
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Amapiano, South African Music"
              className={`mt-2 ${inputClass}`}
            />
          </label>
        </div>
        <label className={labelClass}>
          Excerpt
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className={`mt-2 ${inputClass} resize-y leading-relaxed`}
          />
        </label>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <BlockEditor blocks={blocks} onChange={setBlocks} />
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Direct answer &amp; summary
        </p>
        <p className="mt-2 text-[11px] normal-case leading-relaxed opacity-40">
          The direct answer appears at the top of the article as a concise
          extractable answer to the target query (aim for 40–100 words),
          followed by the detailed article below.
        </p>
        <div className="mt-4 grid gap-4">
          <label className={labelClass}>
            Direct answer
            <textarea
              value={directAnswer}
              onChange={(e) => setDirectAnswer(e.target.value)}
              rows={4}
              placeholder="The best Amapiano songs of 2026 include…"
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <p className="-mt-2 text-right text-[9px] uppercase tracking-[0.18em] opacity-35">
            {answerWords} words
          </p>
          <label className={labelClass}>
            Key takeaways (one per line)
            <textarea
              value={keyTakeaways}
              onChange={(e) => setKeyTakeaways(e.target.value)}
              rows={3}
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <label className={labelClass}>
            Key facts (one per line)
            <textarea
              value={keyFacts}
              onChange={(e) => setKeyFacts(e.target.value)}
              rows={3}
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <label className={labelClass}>
            Article summary (internal — editorial representation)
            <textarea
              value={articleSummary}
              onChange={(e) => setArticleSummary(e.target.value)}
              rows={3}
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <label className={labelClass}>
            Editorial perspective (original analysis angle)
            <textarea
              value={editorialPerspective}
              onChange={(e) => setEditorialPerspective(e.target.value)}
              rows={3}
              placeholder="What makes this ranking/list/review distinctive? Methodology, expertise, first-hand experience…"
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Related questions
        </p>
        <p className="mt-2 text-[11px] normal-case leading-relaxed opacity-40">
          Real questions readers ask around this topic, answered as visible
          sections of the article.
        </p>
        <div className="mt-4 grid gap-4">
          {faq.map((entry, index) => (
            <div
              key={index}
              className="rounded-xl border border-foreground/10 p-3"
            >
              <input
                value={entry.question}
                onChange={(e) =>
                  setFaq((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, question: e.target.value } : item,
                    ),
                  )
                }
                placeholder="Question"
                className={inputClass}
              />
              <textarea
                value={entry.answer}
                onChange={(e) =>
                  setFaq((current) =>
                    current.map((item, i) =>
                      i === index ? { ...item, answer: e.target.value } : item,
                    ),
                  )
                }
                rows={2}
                placeholder="Concise answer"
                className={`mt-2 ${inputClass} resize-y leading-relaxed`}
              />
              <button
                type="button"
                onClick={() =>
                  setFaq((current) => current.filter((_, i) => i !== index))
                }
                className="mt-2 cursor-pointer text-[9px] uppercase tracking-[0.16em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setFaq((current) => [...current, { question: "", answer: "" }])
            }
            className="cursor-pointer self-start rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
          >
            + Add question
          </button>
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Sources
        </p>
        <div className="mt-4 grid gap-4">
          {sources.map((source, index) => (
            <div
              key={index}
              className="rounded-xl border border-foreground/10 p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={source.label}
                  onChange={(e) =>
                    setSources((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Citation label"
                  className={inputClass}
                />
                <input
                  value={source.url}
                  onChange={(e) =>
                    setSources((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, url: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="https://…"
                  className={inputClass}
                />
                <input
                  value={source.publication ?? ""}
                  onChange={(e) =>
                    setSources((current) =>
                      current.map((item, i) =>
                        i === index
                          ? { ...item, publication: e.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Publication (optional)"
                  className={inputClass}
                />
                <input
                  value={source.date ?? ""}
                  onChange={(e) =>
                    setSources((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, date: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="Date (optional)"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setSources((current) => current.filter((_, i) => i !== index))
                }
                className="mt-2 cursor-pointer text-[9px] uppercase tracking-[0.16em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSources((current) => [
                ...current,
                { url: "", label: "", publication: "", date: "" },
              ])
            }
            className="cursor-pointer self-start rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
          >
            + Add source
          </button>
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Author profile
        </p>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Author job title
              <input
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
                placeholder="Music Editor"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <div className={labelClass}>
              Author photo
              <div className="mt-2">
                <ImageUploadField
                  value={authorImage}
                  onChange={setAuthorImage}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          <label className={labelClass}>
            Author bio
            <textarea
              value={authorBio}
              onChange={(e) => setAuthorBio(e.target.value)}
              rows={2}
              placeholder="Who is writing this, and why are they credible on this topic?"
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <div className={labelClass}>
            Social / profile links
            <div className="mt-2 grid gap-2">
              {authorLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={link.label}
                    onChange={(e) =>
                      setAuthorLinks((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      )
                    }
                    placeholder="X / Instagram / LinkedIn"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    value={link.url}
                    onChange={(e) =>
                      setAuthorLinks((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      )
                    }
                    placeholder="https://…"
                    className={`${inputClass} flex-[2]`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAuthorLinks((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    className="cursor-pointer text-[9px] uppercase tracking-[0.16em] text-red-400/80 underline underline-offset-4 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAuthorLinks((current) => [
                    ...current,
                    { label: "", url: "" },
                  ])
                }
                className="cursor-pointer self-start rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
              >
                + Add link
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          SEO &amp; scheduling
        </p>
        <div className="mt-4 grid gap-4">
          <label className={labelClass}>
            SEO title (defaults to the post title)
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className={labelClass}>
            SEO description (defaults to the listing brief)
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Primary keyword
              <input
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="best amapiano songs 2026"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className={labelClass}>
              Secondary keywords (comma-separated)
              <input
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className={labelClass}>
              Search intent
              <select
                value={searchIntent}
                onChange={(e) => setSearchIntent(e.target.value)}
                className={`mt-2 rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] outline-none focus:border-yellow [&>option]:bg-background [&>option]:text-foreground`}
              >
                <option value="">—</option>
                <option value="informational">Informational</option>
                <option value="discovery">Discovery / list</option>
                <option value="navigational">Navigational</option>
                <option value="commercial">Commercial</option>
              </select>
            </label>
            <label className={labelClass}>
              Topics (comma-separated)
              <input
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="Amapiano, South African music"
                className={`mt-2 ${inputClass}`}
              />
            </label>
          </div>
          <label className={labelClass}>
            Entities mentioned (artists, songs, genres, places — comma-separated)
            <input
              value={entities}
              onChange={(e) => setEntities(e.target.value)}
              placeholder="Burna Boy, Last Last, Afrobeats, Nigeria"
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <label className={labelClass}>
            Related articles (slugs, comma-separated — manual topic-cluster links)
            <input
              value={relatedSlugs}
              onChange={(e) => setRelatedSlugs(e.target.value)}
              placeholder="best-amapiano-albums, history-of-amapiano"
              className={`mt-2 ${inputClass}`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={labelClass}>
              Schedule for
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className={labelClass}>
              Materially updated (date)
              <input
                type="date"
                value={materiallyUpdatedAt}
                onChange={(e) => setMateriallyUpdatedAt(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className={labelClass}>
              Reviewed (date)
              <input
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-foreground/10 pt-8">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Pre-publish audit · {auditPassed}/{audit.length}
        </p>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {audit.map((entry) => (
            <li
              key={entry.item}
              className={`flex items-start gap-2 text-[11px] ${
                entry.ok ? "opacity-70" : "text-yellow"
              }`}
            >
              <span>{entry.ok ? "✓" : "⚠"}</span>
              <span>{entry.item}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="mt-6 text-[12px] text-red-400">{error}</p>}
      {notice && <p className="mt-6 text-[12px] text-yellow">{notice}</p>}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => save("draft")}
          disabled={busy}
          className="flex-1 cursor-pointer rounded-full border border-foreground/20 px-4 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save draft"}
        </button>
        {publishedAt ? (
          <button
            type="button"
            onClick={() => save("schedule")}
            disabled={busy}
            className="flex-1 cursor-pointer rounded-full border border-yellow/50 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-yellow transition-colors hover:bg-yellow/10 disabled:opacity-50"
          >
            Schedule
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => save("publish")}
          disabled={busy}
          className="flex-1 cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Working…" : "Publish"}
        </button>
      </div>
    </main>
  );
}
