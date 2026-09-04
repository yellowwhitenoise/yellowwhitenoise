"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";
import { SubscribeForm } from "@/components/SubscribeForm";
import type { BlogPost } from "@/lib/blog";
import type { SiteContent } from "@/lib/site-content";

const tabs = [
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "blog", label: "Blog", path: "/blog" },
  { id: "legal", label: "Privacy & Legal", path: "/privacy" },
] as const;

type SectionId = (typeof tabs)[number]["id"];

const headings: Record<SectionId, string> = {
  about: "About",
  contact: "Contact",
  blog: "Blog",
  legal: "Privacy & Legal",
};

const socials = [
  { label: "Instagram", url: "https://www.instagram.com/yellowwhitenoise" },
  { label: "Facebook", url: "https://www.facebook.com/yellowwhitenoise" },
  { label: "TikTok", url: "https://www.tiktok.com/@yellowwhitenoise" },
  { label: "X", url: "https://x.com/yellowwhitenoise" },
  { label: "Threads", url: "https://www.threads.net/@yellowwhitenoise" },
  { label: "YouTube", url: "https://www.youtube.com/@yellowwhitenoise" },
];

const sortOptions = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "az", label: "A–Z" },
  { id: "za", label: "Z–A" },
] as const;

type SortId = (typeof sortOptions)[number]["id"];

function parsePostDate(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sectionFromPath(pathname: string): SectionId {
  const match = tabs.find((tab) => tab.path === pathname);
  return match ? match.id : "about";
}

export function InfoSections({
  initialSection,
  initialPosts,
  content,
}: {
  initialSection: SectionId;
  initialPosts: BlogPost[];
  content: SiteContent;
}) {
  const [active, setActive] = useState<SectionId>(initialSection);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [sort, setSort] = useState<SortId>("newest");
  const [query, setQuery] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/posts?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data: BlogPost[]) => setPosts(data))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    if (sort === "oldest") {
      sorted.sort((a, b) => parsePostDate(a.date) - parsePostDate(b.date));
    } else if (sort === "newest") {
      sorted.sort((a, b) => parsePostDate(b.date) - parsePostDate(a.date));
    } else if (sort === "az") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    }
    return sorted;
  }, [posts, sort]);

  useEffect(() => {
    if (fetchedRef.current || posts.length > 0) return;
    fetchedRef.current = true;
    fetch("/api/posts")
      .then((response) => response.json())
      .then((data: BlogPost[]) => setPosts(data))
      .catch(() => {});
  }, [posts.length]);

  useEffect(() => {
    const onPopState = () => {
      setActive(sectionFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectSection = (id: SectionId, path: string) => {
    setActive(id);
    window.history.pushState(null, "", path);
  };

  const tabButton = (id: SectionId, label: string, path: string) => (
    <button
      key={id}
      type="button"
      onClick={() => selectSection(id, path)}
      className={`cursor-pointer whitespace-nowrap text-left text-[13px] transition-colors md:text-sm ${
        active === id
          ? "text-foreground"
          : "text-foreground/40 hover:text-foreground/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="relative mx-auto w-full max-w-5xl px-5 pt-28 pb-24 md:px-10 md:pt-28 md:pb-16">
      <h1 className="sr-only">{headings[active]} — Yellow White Noise</h1>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-background to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-gradient-to-t from-background to-transparent"
      />

      <div className="flex gap-6 overflow-x-auto pb-2 md:hidden">
        {tabs.map((tab) => tabButton(tab.id, tab.label, tab.path))}
      </div>

      <div className="grid w-full gap-10 md:min-h-[calc(100dvh-190px)] md:grid-cols-[190px_minmax(0,1fr)]">
        <div className="hidden md:sticky md:top-28 md:h-[calc(100dvh-170px)] md:self-start md:flex md:flex-col md:justify-end">
          {tabs.map((tab) => tabButton(tab.id, tab.label, tab.path))}
          <div className="mt-8 flex flex-col gap-2">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-foreground/60 transition-colors hover:text-yellow"
              >
                {social.label}
              </a>
            ))}
          </div>
          <p className="mt-8 text-[10px] uppercase tracking-[0.18em] opacity-35">
            © 2026 Yellow White Noise
          </p>
        </div>

        <div key={active} className="rise-in min-w-0 md:self-start">
          {active === "about" && (
            <div className="space-y-4 text-[13px] leading-relaxed opacity-80 md:text-[14px]">
              {content.about.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}

          {active === "contact" && (
            <div className="text-[13px] md:text-[14px]">
              <div className="space-y-6">
                {content.contact.entries.map((entry) => (
                  <div key={entry.label}>
                    <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
                      {entry.label}
                    </p>
                    {entry.note && (
                      <p className="mt-1 text-[12px] leading-relaxed opacity-70">
                        {entry.note}
                      </p>
                    )}
                    <a
                      href={`mailto:${entry.email}`}
                      className="mt-1 inline-block transition-colors hover:text-yellow"
                    >
                      {entry.email}
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <div className="w-full max-w-sm rounded-2xl border border-yellow/25 p-5">
                  <p className="font-display text-base font-semibold uppercase tracking-[0.08em]">
                    Get updates
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed opacity-70">
                    One email when a new track, album or playlist drops.
                    Nothing else.
                  </p>
                  <div className="mt-4">
                    <SubscribeForm />
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === "blog" && (
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col items-start">
                  <ResponsiveMenu
                    label="Sort"
                    activeLabel={`Sort: ${sortOptions.find((option) => option.id === sort)?.label ?? "Newest"}`}
                    buttonClassName="cursor-pointer rounded-full border border-foreground/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors hover:bg-foreground/10"
                  >
                    {(close) => (
                      <>
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setSort(option.id);
                              close();
                            }}
                            className={`block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] transition-colors hover:bg-foreground/10 md:px-3 md:py-2 md:text-[12px] ${
                              sort === option.id ? "text-yellow" : ""
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </>
                    )}
                  </ResponsiveMenu>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search posts…"
                  className="w-full rounded-full border border-foreground/15 bg-transparent px-4 py-2 text-[12px] outline-none focus:border-yellow sm:w-56"
                />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sortedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-2xl border border-foreground/10 p-3 transition-colors hover:bg-foreground/[0.05]"
                >
                  <div
                    className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl bg-cover bg-center"
                    style={{
                      backgroundImage: post.heroImage
                        ? `url(${post.heroImage})`
                        : `linear-gradient(140deg, ${post.heroPalette.from}, ${post.heroPalette.to})`,
                    }}
                  >
                    {!post.heroImage && (
                      <span className="absolute inset-0 flex items-center justify-center font-display text-3xl text-white/20">
                        {post.title[0]}
                      </span>
                    )}
                  </div>
                  <p className="px-1 text-[9px] uppercase tracking-[0.2em] opacity-40">
                    {post.date}
                  </p>
                  <h3 className="mt-1.5 px-1 text-[13px] font-medium leading-snug transition-colors group-hover:text-yellow">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 px-1 pb-1 text-[11px] leading-relaxed opacity-60">
                    {post.brief}
                  </p>
                </Link>
              ))}
              </div>
              {sortedPosts.length === 0 && (
                <p className="py-6 text-[12px] opacity-50">
                  No posts match your search.
                </p>
              )}
            </div>
          )}

          {active === "legal" && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
                  Privacy Policy · Contents
                </p>
                <ol className="mt-2 space-y-0.5 text-[11px] opacity-60">
                  {content.legal.sections.map((legal, index) => (
                    <li key={legal.id}>
                      <a
                        href={`#${legal.id}`}
                        className="transition-colors hover:text-yellow"
                      >
                        {index + 1}. {legal.heading.replace(/^\d+\.\s*/, "")}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
              {content.legal.sections.map((legal) => (
                <div key={legal.id} id={legal.id} className="scroll-mt-28">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                    {legal.heading}
                  </h3>
                  <div className="mt-2 space-y-3 text-[12px] leading-relaxed opacity-75">
                    {legal.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 md:hidden">
        {socials.map((social) => (
          <a
            key={social.label}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-foreground/60 transition-colors hover:text-yellow"
          >
            {social.label}
          </a>
        ))}
      </div>

      <p className="mt-8 pb-4 text-center text-[10px] uppercase tracking-[0.18em] opacity-35 md:hidden">
        © 2026 Yellow White Noise
      </p>
    </main>
  );
}
