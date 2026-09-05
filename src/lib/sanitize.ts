import sanitizeHtml from "sanitize-html";

/** Allow only absolute https image URLs (used for the email logo). */
export function sanitizeLogoUrl(value?: string): string | undefined {
  const raw = value?.trim().replace(/["<>\s]/g, "");
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Shared HTML sanitizer for admin-authored rich content (blog embeds, ad
 * creatives, email templates). Admins are trusted, but stored HTML renders
 * to every visitor/subscriber, so script, event handlers, and off-origin
 * frames are stripped while everyday formatting and media embeds survive.
 */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "div",
      "span",
      "table",
      "tbody",
      "tr",
      "td",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title", "style"],
      img: ["src", "alt", "width", "height", "style"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "allow",
        "allowfullscreen",
        "frameborder",
        "loading",
        "style",
      ],
      p: ["style"],
      div: ["style"],
      span: ["style"],
      ul: ["style"],
      ol: ["style"],
      li: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      table: ["style"],
      td: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
      iframe: ["http", "https"],
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "www.youtube-nocookie.com",
      "open.spotify.com",
      "embed.music.apple.com",
    ],
    allowProtocolRelative: false,
  });
}
