export type AdSlotId =
  | "before_article"
  | "after_intro"
  | "after_paragraph_3"
  | "between_sections"
  | "top10_after_5"
  | "before_conclusion"
  | "after_conclusion"
  | "sidebar"
  | "mobile_sticky"
  | "desktop_sticky"
  | "article_mid";

export const AD_SLOTS: { id: AdSlotId; label: string }[] = [
  { id: "before_article", label: "Before article" },
  { id: "after_intro", label: "After introduction" },
  { id: "after_paragraph_3", label: "After paragraph 3" },
  { id: "between_sections", label: "Between sections" },
  { id: "top10_after_5", label: "After #5 in a Top 10" },
  { id: "before_conclusion", label: "Before conclusion" },
  { id: "after_conclusion", label: "After conclusion" },
  { id: "sidebar", label: "Sidebar" },
  { id: "mobile_sticky", label: "Mobile sticky" },
  { id: "desktop_sticky", label: "Desktop sticky" },
  { id: "article_mid", label: "Article mid" },
];

export type MusicProvider = "spotify" | "appleMusic" | "youtubeMusic";
export type MusicContentType = "track" | "album" | "playlist";

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | {
      type: "gallery";
      images: { src: string; alt?: string; caption?: string }[];
    }
  | {
      type: "music";
      provider: MusicProvider;
      contentType: MusicContentType;
      url: string;
      providerId?: string;
      title?: string;
      artist?: string;
      artworkUrl?: string;
    }
  | { type: "youtube"; videoId: string; caption?: string }
  | {
      type: "video";
      url: string;
      thumbnailUrl?: string;
      title?: string;
      caption?: string;
    }
  | { type: "quote"; text: string; author?: string }
  | {
      type: "link";
      url: string;
      label: string;
      description?: string;
      sponsored?: boolean;
    }
  | { type: "advertisement"; slot: AdSlotId }
  | { type: "divider" }
  | { type: "embed"; html?: string; url?: string };

export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,20})/,
  );
  return match ? match[1] : null;
}

export function parseSpotifyUrl(
  url: string,
): { contentType: MusicContentType; providerId: string } | null {
  const match = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]+)/,
  );
  if (!match) return null;
  return {
    contentType: match[1] as MusicContentType,
    providerId: match[2],
  };
}

export function parseAppleMusicUrl(
  url: string,
): { storefront: string; contentType: string; path: string } | null {
  const match = url.match(
    /music\.apple\.com\/([a-z]{2})\/(album|song|playlist)\/([^?#/]+)/,
  );
  if (!match) return null;
  return { storefront: match[1], contentType: match[2], path: match[3] };
}

export function normalizeBlocks(raw: unknown): BlogBlock[] {
  if (!Array.isArray(raw)) return [];
  const blocks: BlogBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const block = item as Record<string, unknown>;
    switch (block.type) {
      case "paragraph":
        blocks.push({ type: "paragraph", text: String(block.text ?? "") });
        break;
      case "heading": {
        const level = Number(block.level);
        blocks.push({
          type: "heading",
          level: level === 3 || level === 4 ? level : 2,
          text: String(block.text ?? ""),
        });
        break;
      }
      case "image":
        if (typeof block.src === "string" && block.src) {
          blocks.push({
            type: "image",
            src: block.src,
            alt: String(block.alt ?? ""),
            caption:
              block.caption === undefined ? undefined : String(block.caption),
          });
        }
        break;
      case "gallery": {
        const rawImages = Array.isArray(block.images) ? block.images : [];
        blocks.push({
          type: "gallery",
          images: rawImages
            .filter(
              (image): image is { src: string; alt?: string; caption?: string } =>
                Boolean(image) && typeof image.src === "string" && image.src !== "",
            )
            .map((image) => ({
              src: String(image.src),
              alt: image.alt === undefined ? undefined : String(image.alt),
              caption:
                image.caption === undefined ? undefined : String(image.caption),
            })),
        });
        break;
      }
      case "music":
        blocks.push({
          type: "music",
          provider: (block.provider as MusicProvider) ?? "spotify",
          contentType: (block.contentType as MusicContentType) ?? "track",
          url: String(block.url ?? ""),
          providerId:
            block.providerId === undefined
              ? undefined
              : String(block.providerId),
          title: block.title === undefined ? undefined : String(block.title),
          artist:
            block.artist === undefined ? undefined : String(block.artist),
          artworkUrl:
            block.artworkUrl === undefined
              ? undefined
              : String(block.artworkUrl),
        });
        break;
      case "youtube":
        if (typeof block.videoId === "string" && block.videoId) {
          blocks.push({
            type: "youtube",
            videoId: block.videoId,
            caption:
              block.caption === undefined ? undefined : String(block.caption),
          });
        }
        break;
      case "video":
        if (typeof block.url === "string" && block.url) {
          blocks.push({
            type: "video",
            url: block.url,
            thumbnailUrl:
              block.thumbnailUrl === undefined
                ? undefined
                : String(block.thumbnailUrl),
            title: block.title === undefined ? undefined : String(block.title),
            caption:
              block.caption === undefined ? undefined : String(block.caption),
          });
        }
        break;
      case "quote":
        blocks.push({
          type: "quote",
          text: String(block.text ?? ""),
          author:
            block.author === undefined ? undefined : String(block.author),
        });
        break;
      case "link":
        if (typeof block.url === "string" && block.url.trim() !== "") {
          blocks.push({
            type: "link",
            url: String(block.url),
            label: String(block.label ?? block.url ?? ""),
            description:
              block.description === undefined
                ? undefined
                : String(block.description),
            sponsored:
              block.sponsored === undefined
                ? undefined
                : Boolean(block.sponsored),
          });
        }
        break;
      case "advertisement":
        blocks.push({
          type: "advertisement",
          slot: (block.slot as AdSlotId) ?? "article_mid",
        });
        break;
      case "divider":
        blocks.push({ type: "divider" });
        break;
      case "embed":
        blocks.push({
          type: "embed",
          html: block.html === undefined ? undefined : String(block.html),
          url: block.url === undefined ? undefined : String(block.url),
        });
        break;
      default:
        break;
    }
  }
  return blocks;
}

export function insertAutomaticAds(
  blocks: BlogBlock[],
  options?: { everyParagraphs?: number; everyHeadings?: number; midDepth?: boolean },
): BlogBlock[] {
  const everyParagraphs = options?.everyParagraphs ?? 4;
  const everyHeadings = options?.everyHeadings ?? 3;
  const midDepth = options?.midDepth ?? true;

  const output: BlogBlock[] = [];
  let paragraphs = 0;
  let headings = 0;
  const total = blocks.length;
  const hasAdAdjacent = (index: number) => {
    const previous = output[output.length - 1];
    if (previous?.type === "advertisement") return true;
    return blocks[index + 1]?.type === "advertisement";
  };
  const insertAd = (slot: AdSlotId) => {
    output.push({ type: "advertisement", slot });
  };

  blocks.forEach((block, index) => {
    output.push(block);
    if (block.type === "advertisement") return;
    if (block.type === "paragraph") {
      paragraphs += 1;
      if (
        paragraphs % everyParagraphs === 0 &&
        index < total - 1 &&
        !hasAdAdjacent(index)
      ) {
        insertAd("article_mid");
      }
    }
    if (block.type === "heading" && block.level === 2) {
      headings += 1;
      if (
        headings % everyHeadings === 0 &&
        index < total - 1 &&
        !hasAdAdjacent(index)
      ) {
        insertAd("between_sections");
      }
    }
  });

  if (midDepth && output.length > 4) {
    const midpoint = Math.floor(output.length / 2);
    if (
      output[midpoint]?.type !== "advertisement" &&
      output[midpoint - 1]?.type !== "advertisement"
    ) {
      output.splice(midpoint, 0, { type: "advertisement", slot: "article_mid" });
    }
  }

  return output;
}
