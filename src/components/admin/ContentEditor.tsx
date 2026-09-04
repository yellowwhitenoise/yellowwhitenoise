"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SiteContent } from "@/lib/site-content";

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow";

export function ContentEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const [aboutParagraphs, setAboutParagraphs] = useState(
    initial.about.paragraphs.join("\n\n"),
  );
  const [entries, setEntries] = useState(initial.contact.entries);
  const [sections, setSections] = useState(initial.legal.sections);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"about" | "contact" | "legal">("about");

  const save = async () => {
    setBusy(true);
    setNotice(null);
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        about: {
          paragraphs: aboutParagraphs
            .split("\n\n")
            .map((paragraph) => paragraph.trim())
            .filter(Boolean),
        },
        contact: { entries },
        legal: { sections },
      }),
    });
    setBusy(false);
    setNotice(response.ok ? "Saved and published." : "Save failed.");
    if (response.ok) router.refresh();
  };

  const updateSection = (index: number, heading: string) => {
    setSections((current) =>
      current.map((section, i) =>
        i === index
          ? {
              ...section,
              id:
                section.id ||
                heading
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "") ||
                `section-${index + 1}`,
              heading,
            }
          : section,
      ),
    );
  };

  const updateSectionParagraphs = (index: number, text: string) => {
    setSections((current) =>
      current.map((section, i) =>
        i === index
          ? {
              ...section,
              paragraphs: text.split("\n\n").map((p) => p.trim()),
            }
          : section,
      ),
    );
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-12">
      <Link
        href="/admin"
        className="text-[10px] uppercase tracking-[0.22em] opacity-50 transition-opacity hover:opacity-100"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold uppercase tracking-[0.1em]">
        Site content
      </h1>
      <p className="mt-2 text-[12px] opacity-60">
        Edits publish immediately to the About, Contact and Privacy pages.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            { id: "about", label: "About" },
            { id: "contact", label: "Contact" },
            { id: "legal", label: "Privacy & Legal" },
          ] as const
        ).map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
              tab === entry.id
                ? "bg-foreground text-background"
                : "border border-foreground/15 opacity-60 hover:opacity-100"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "about" && (
          <label className="block text-[10px] uppercase tracking-[0.22em] opacity-50">
            Paragraphs (separate with a blank line)
            <textarea
              value={aboutParagraphs}
              onChange={(e) => setAboutParagraphs(e.target.value)}
              rows={10}
              className={`mt-2 ${inputClass} resize-y leading-relaxed`}
            />
          </label>
        )}

        {tab === "contact" && (
          <div>
            <ul className="flex flex-col gap-3">
              {entries.map((entry, index) => (
                <li
                  key={index}
                  className="rounded-2xl border border-foreground/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
                      Entry {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setEntries((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className="cursor-pointer rounded-md border border-red-400/30 px-2 py-0.5 text-[10px] text-red-400/80 hover:bg-red-400/10"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={entry.label}
                      onChange={(e) =>
                        setEntries((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, label: e.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Label (General, Demos, Bookings…)"
                      className={inputClass}
                    />
                    <input
                      value={entry.email}
                      onChange={(e) =>
                        setEntries((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, email: e.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="email@yellowwhitenoise.com"
                      className={inputClass}
                    />
                    <input
                      value={entry.note ?? ""}
                      onChange={(e) =>
                        setEntries((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, note: e.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Note (optional)"
                      className={inputClass}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setEntries((current) => [
                  ...current,
                  { label: "", email: "" },
                ])
              }
              className="mt-3 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
            >
              + Contact entry
            </button>
          </div>
        )}

        {tab === "legal" && (
          <div>
            <ul className="flex flex-col gap-3">
              {sections.map((section, index) => (
                <li
                  key={section.id}
                  className="rounded-2xl border border-foreground/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
                      Section {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setSections((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className="cursor-pointer rounded-md border border-red-400/30 px-2 py-0.5 text-[10px] text-red-400/80 hover:bg-red-400/10"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <input
                      value={section.heading}
                      onChange={(e) => updateSection(index, e.target.value)}
                      placeholder="Section heading"
                      className={inputClass}
                    />
                    <textarea
                      value={section.paragraphs.join("\n\n")}
                      onChange={(e) =>
                        updateSectionParagraphs(index, e.target.value)
                      }
                      rows={5}
                      placeholder="Paragraphs (separate with a blank line)"
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setSections((current) => [
                  ...current,
                  {
                    id: `section-${current.length + 1}`,
                    heading: "",
                    paragraphs: [""],
                  },
                ])
              }
              className="mt-3 cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
            >
              + Section
            </button>
          </div>
        )}
      </div>

      {notice && <p className="mt-6 text-[12px] text-yellow">{notice}</p>}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-8 w-full cursor-pointer rounded-full bg-foreground px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save & publish"}
      </button>
    </main>
  );
}
