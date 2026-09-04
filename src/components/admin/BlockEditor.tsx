"use client";

import { useRef, useState } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { ResponsiveMenu } from "@/components/ResponsiveMenu";
import {
  AD_SLOTS,
  extractYouTubeId,
  parseSpotifyUrl,
  type BlogBlock,
  type MusicContentType,
  type MusicProvider,
} from "@/lib/blocks";

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-transparent px-3 py-2.5 text-[13px] outline-none focus:border-yellow";

const INSERTER: { type: BlogBlock["type"]; label: string; make: () => BlogBlock }[] = [
  { type: "paragraph", label: "Paragraph", make: () => ({ type: "paragraph", text: "" }) },
  { type: "heading", label: "Heading (H2/H3/H4)", make: () => ({ type: "heading", level: 2, text: "" }) },
  { type: "image", label: "Image", make: () => ({ type: "image", src: "", alt: "" }) },
  { type: "gallery", label: "Image gallery", make: () => ({ type: "gallery", images: [] }) },
  { type: "music", label: "Music", make: () => ({ type: "music", provider: "spotify", contentType: "track", url: "", title: "", artist: "" }) },
  { type: "youtube", label: "YouTube video", make: () => ({ type: "youtube", videoId: "" }) },
  { type: "video", label: "Uploaded video", make: () => ({ type: "video", url: "" }) },
  { type: "quote", label: "Quote", make: () => ({ type: "quote", text: "" }) },
  { type: "link", label: "Link / button", make: () => ({ type: "link", url: "", label: "" }) },
  { type: "advertisement", label: "Advertisement", make: () => ({ type: "advertisement", slot: "article_mid" }) },
  { type: "divider", label: "Divider", make: () => ({ type: "divider" }) },
  { type: "embed", label: "Custom embed", make: () => ({ type: "embed", url: "" }) },
];

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
}) {
  const insert = (make: () => BlogBlock) => {
    onChange([...blocks, make()]);
  };

  const update = (index: number, patch: Partial<BlogBlock>) => {
    onChange(
      blocks.map((block, i) =>
        i === index ? ({ ...block, ...patch } as BlogBlock) : block,
      ),
    );
  };

  const remove = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const typeLabel = (block: BlogBlock): string => {
    if (block.type === "heading") return `H${block.level}`;
    if (block.type === "music") return `Music · ${block.provider}`;
    return INSERTER.find((entry) => entry.type === block.type)?.label ?? block.type;
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.22em] opacity-50">
          Content blocks
        </p>
        <div className="ml-auto flex flex-col items-end">
          <ResponsiveMenu
            label="+ Add block"
            buttonClassName="cursor-pointer rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
            align="right"
          >
            {(close) => (
              <>
                {INSERTER.map((entry) => (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => {
                      insert(entry.make);
                      close();
                    }}
                    className="block w-full cursor-pointer rounded-xl px-4 py-3 text-left text-[13px] transition-colors hover:bg-foreground/10 md:px-3 md:py-2 md:text-[12px]"
                  >
                    {entry.label}
                  </button>
                ))}
              </>
            )}
          </ResponsiveMenu>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {blocks.map((block, index) => (
          <li
            key={index}
            className="rounded-2xl border border-foreground/10 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
                {index + 1} · {typeLabel(block)}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  className="cursor-pointer rounded-md border border-foreground/15 px-2 py-0.5 text-[10px] hover:bg-foreground/10"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  className="cursor-pointer rounded-md border border-foreground/15 px-2 py-0.5 text-[10px] hover:bg-foreground/10"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="cursor-pointer rounded-md border border-red-400/30 px-2 py-0.5 text-[10px] text-red-400/80 hover:bg-red-400/10"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-3">
              {block.type === "paragraph" && (
                <textarea
                  value={block.text}
                  onChange={(e) => update(index, { type: "paragraph", text: e.target.value })}
                  rows={3}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              )}

              {block.type === "heading" && (
                <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)]">
                  <select
                    value={block.level}
                    onChange={(e) =>
                      update(index, {
                        type: "heading",
                        level: Number(e.target.value) as 2 | 3 | 4,
                      })
                    }
                    className="rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
                  >
                    <option value={2} className="bg-background text-foreground">H2</option>
                    <option value={3} className="bg-background text-foreground">H3</option>
                    <option value={4} className="bg-background text-foreground">H4</option>
                  </select>
                  <input
                    value={block.text}
                    onChange={(e) =>
                      update(index, { type: "heading", text: e.target.value })
                    }
                    placeholder="Subheader text"
                    className={inputClass}
                  />
                </div>
              )}

              {block.type === "image" && (
                <div className="grid gap-2">
                  <ImageUploadField
                    value={block.src}
                    onChange={(src) => update(index, { type: "image", src })}
                    placeholder="Image URL or upload"
                  />
                  <input
                    value={block.alt}
                    onChange={(e) => update(index, { type: "image", alt: e.target.value })}
                    placeholder="Alt text"
                    className={inputClass}
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(e) =>
                      update(index, { type: "image", caption: e.target.value })
                    }
                    placeholder="Caption (optional)"
                    className={inputClass}
                  />
                </div>
              )}

              {block.type === "gallery" && (
                <div className="grid gap-2">
                  {block.images.map((image, imageIndex) => (
                    <div key={imageIndex} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <ImageUploadField
                          value={image.src}
                          onChange={(src) =>
                            update(index, {
                              type: "gallery",
                              images: block.images.map((entry, i) =>
                                i === imageIndex ? { ...entry, src } : entry,
                              ),
                            })
                          }
                          placeholder="Image URL or upload"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          update(index, {
                            type: "gallery",
                            images: block.images.filter((_, i) => i !== imageIndex),
                          })
                        }
                        className="cursor-pointer rounded-md border border-red-400/30 px-2 py-1 text-[10px] text-red-400/80 hover:bg-red-400/10"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      update(index, {
                        type: "gallery",
                        images: [...block.images, { src: "", alt: "" }],
                      })
                    }
                    className="cursor-pointer self-start rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10"
                  >
                    + Image
                  </button>
                </div>
              )}

              {block.type === "music" && (
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      value={block.provider}
                      onChange={(e) =>
                        update(index, {
                          type: "music",
                          provider: e.target.value as MusicProvider,
                        })
                      }
                      className="rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
                    >
                      <option value="spotify" className="bg-background text-foreground">Spotify</option>
                      <option value="appleMusic" className="bg-background text-foreground">Apple Music</option>
                      <option value="youtubeMusic" className="bg-background text-foreground">YouTube Music</option>
                    </select>
                    <select
                      value={block.contentType}
                      onChange={(e) =>
                        update(index, {
                          type: "music",
                          contentType: e.target.value as MusicContentType,
                        })
                      }
                      className="rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
                    >
                      <option value="track" className="bg-background text-foreground">Song / Track</option>
                      <option value="album" className="bg-background text-foreground">Album</option>
                      <option value="playlist" className="bg-background text-foreground">Playlist</option>
                    </select>
                  </div>
                  <input
                    value={block.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      const patch: Partial<BlogBlock> = { type: "music", url };
                      if (block.provider === "spotify") {
                        const parsed = parseSpotifyUrl(url);
                        if (parsed) {
                          Object.assign(patch, {
                            providerId: parsed.providerId,
                            contentType: parsed.contentType,
                          });
                        }
                      }
                      update(index, patch);
                    }}
                    placeholder={`Paste ${block.provider === "appleMusic" ? "Apple Music" : block.provider === "youtubeMusic" ? "YouTube Music" : "Spotify"} URL`}
                    className={inputClass}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      value={block.title ?? ""}
                      onChange={(e) =>
                        update(index, { type: "music", title: e.target.value })
                      }
                      placeholder="Title"
                      className={inputClass}
                    />
                    <input
                      value={block.artist ?? ""}
                      onChange={(e) =>
                        update(index, { type: "music", artist: e.target.value })
                      }
                      placeholder="Artist"
                      className={inputClass}
                    />
                  </div>
                  <ImageUploadField
                    value={block.artworkUrl ?? ""}
                    onChange={(artworkUrl) =>
                      update(index, { type: "music", artworkUrl })
                    }
                    placeholder="Artwork URL or upload"
                  />
                </div>
              )}

              {block.type === "youtube" && (
                <div className="grid gap-2">
                  <input
                    value={block.videoId ? `https://www.youtube.com/watch?v=${block.videoId}` : ""}
                    onChange={(e) => {
                      const videoId = extractYouTubeId(e.target.value) ?? "";
                      update(index, { type: "youtube", videoId });
                    }}
                    placeholder="Paste YouTube URL"
                    className={inputClass}
                  />
                  {block.videoId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://img.youtube.com/vi/${block.videoId}/hqdefault.jpg`}
                      alt="Video thumbnail"
                      className="aspect-video w-full rounded-xl object-cover"
                    />
                  )}
                  <input
                    value={block.caption ?? ""}
                    onChange={(e) =>
                      update(index, { type: "youtube", caption: e.target.value })
                    }
                    placeholder="Caption (optional)"
                    className={inputClass}
                  />
                </div>
              )}

              {block.type === "video" && (
                <div className="grid gap-2">
                  <VideoUploadField
                    value={block.url}
                    onChange={(url) => update(index, { type: "video", url })}
                  />
                  <ImageUploadField
                    value={block.thumbnailUrl ?? ""}
                    onChange={(thumbnailUrl) =>
                      update(index, { type: "video", thumbnailUrl })
                    }
                    placeholder="Thumbnail URL or upload"
                  />
                  <input
                    value={block.title ?? ""}
                    onChange={(e) => update(index, { type: "video", title: e.target.value })}
                    placeholder="Video title"
                    className={inputClass}
                  />
                  <input
                    value={block.caption ?? ""}
                    onChange={(e) =>
                      update(index, { type: "video", caption: e.target.value })
                    }
                    placeholder="Caption (optional)"
                    className={inputClass}
                  />
                </div>
              )}

              {block.type === "quote" && (
                <div className="grid gap-2">
                  <textarea
                    value={block.text}
                    onChange={(e) => update(index, { type: "quote", text: e.target.value })}
                    rows={2}
                    className={`${inputClass} resize-y leading-relaxed`}
                  />
                  <input
                    value={block.author ?? ""}
                    onChange={(e) => update(index, { type: "quote", author: e.target.value })}
                    placeholder="Author (optional)"
                    className={inputClass}
                  />
                </div>
              )}

              {block.type === "link" && (
                <div className="grid gap-2">
                  <input
                    value={block.label}
                    onChange={(e) => update(index, { type: "link", label: e.target.value })}
                    placeholder="Button label (e.g. Shop the product)"
                    className={inputClass}
                  />
                  <input
                    value={block.url}
                    onChange={(e) => update(index, { type: "link", url: e.target.value })}
                    placeholder="https://… (affiliate or product URL)"
                    className={inputClass}
                  />
                  <input
                    value={block.description ?? ""}
                    onChange={(e) =>
                      update(index, { type: "link", description: e.target.value })
                    }
                    placeholder="Short description (optional)"
                    className={inputClass}
                  />
                  <label className="flex items-center gap-2 text-[11px] opacity-70">
                    <input
                      type="checkbox"
                      checked={block.sponsored ?? false}
                      onChange={(e) =>
                        update(index, { type: "link", sponsored: e.target.checked })
                      }
                      className="h-4 w-4 accent-yellow"
                    />
                    Affiliate / sponsored link (adds rel=&quot;sponsored nofollow&quot;)
                  </label>
                  <p className="text-[11px] opacity-40">
                    Tip: you can also add inline links inside a paragraph with
                    [link text](https://example.com).
                  </p>
                </div>
              )}

              {block.type === "advertisement" && (
                <select
                  value={block.slot}
                  onChange={(e) =>
                    update(index, {
                      type: "advertisement",
                      slot: e.target.value as typeof block.slot,
                    })
                  }
                  className="rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-[13px] text-foreground outline-none focus:border-yellow"
                >
                  {AD_SLOTS.map((entry) => (
                    <option
                      key={entry.id}
                      value={entry.id}
                      className="bg-background text-foreground"
                    >
                      {entry.label}
                    </option>
                  ))}
                </select>
              )}

              {block.type === "divider" && (
                <p className="text-[11px] opacity-40">
                  A horizontal divider renders here.
                </p>
              )}

              {block.type === "embed" && (
                <div className="grid gap-2">
                  <input
                    value={block.url ?? ""}
                    onChange={(e) => update(index, { type: "embed", url: e.target.value })}
                    placeholder="Embed URL"
                    className={inputClass}
                  />
                  <textarea
                    value={block.html ?? ""}
                    onChange={(e) => update(index, { type: "embed", html: e.target.value })}
                    rows={3}
                    placeholder="Or paste custom embed HTML"
                    className={`${inputClass} resize-y font-mono text-[11px]`}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VideoUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    let duration: number | null = null;
    try {
      duration = await new Promise<number | null>((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve(video.duration || null);
        video.onerror = () => resolve(null);
        video.src = URL.createObjectURL(file);
      });
    } catch {
      duration = null;
    }
    const form = new FormData();
    form.append("file", file);
    if (duration) form.append("duration", String(Math.round(duration)));
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };
    setUploading(false);
    if (response.ok && data.url) {
      onChange(data.url);
    } else {
      setError(data.error ?? "Upload failed.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace video" : "Upload video"}
        </button>
        {value && (
          <span className="truncate text-[10px] uppercase tracking-[0.14em] opacity-40">
            Uploaded ✓
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/mp2t,video/x-matroska"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
