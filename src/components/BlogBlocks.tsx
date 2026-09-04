import { AdSlot } from "@/components/AdSlot";
import {
  extractYouTubeId,
  insertAutomaticAds,
  normalizeBlocks,
  parseAppleMusicUrl,
  parseSpotifyUrl,
  type BlogBlock,
} from "@/lib/blocks";

function renderInlineLinks(text: string) {
  const parts = text.split(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (i % 3 === 2) {
      const label = parts[i - 1];
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-4 hover:text-yellow"
        >
          {label}
        </a>
      );
    }
    if (i % 3 === 1) return null;
    return <span key={i}>{part}</span>;
  });
}

function MusicEmbed({ block }: { block: Extract<BlogBlock, { type: "music" }> }) {
  let embed: { src: string; title: string } | null = null;

  if (block.provider === "spotify") {
    const parsed = parseSpotifyUrl(block.url);
    const contentType = parsed?.contentType ?? block.contentType;
    const providerId = parsed?.providerId ?? block.providerId;
    if (providerId) {
      embed = {
        src: `https://open.spotify.com/embed/${contentType}/${providerId}`,
        title: `${contentType} on Spotify`,
      };
    }
  }

  if (block.provider === "appleMusic") {
    const parsed = parseAppleMusicUrl(block.url);
    if (parsed) {
      embed = {
        src: `https://embed.music.apple.com/${parsed.storefront}/${parsed.contentType}/${parsed.path}?app=music`,
        title: "Apple Music player",
      };
    }
  }

  const youtubeId =
    block.provider === "youtubeMusic" ? extractYouTubeId(block.url) : null;

  return (
    <figure className="my-8 min-w-0 max-w-full overflow-hidden">
      {embed ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-foreground/10">
          <iframe
            src={embed.src}
            title={embed.title}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="h-[152px] w-full md:h-[180px]"
          />
        </div>
      ) : (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-yellow/30 p-4 transition-colors hover:bg-foreground/[0.04]"
        >
          {block.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.artworkUrl}
              alt={block.title ?? "Artwork"}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundImage:
                  "linear-gradient(140deg, #2a3f4d, #101b23)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/40" fill="currentColor" aria-hidden>
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z" />
              </svg>
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] uppercase tracking-[0.24em] text-yellow">
              Music · {block.provider === "appleMusic" ? "Apple Music" : block.provider === "youtubeMusic" ? "YouTube Music" : "Spotify"}
            </span>
            <span className="mt-1 block truncate text-[14px] font-medium">
              {block.title ?? "Listen now"}
            </span>
            {block.artist && (
              <span className="block truncate text-[12px] opacity-55">
                {block.artist}
              </span>
            )}
          </span>
          <span className="shrink-0 rounded-full bg-foreground px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-background">
            ▶ Play
          </span>
        </a>
      )}
      {youtubeId && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/10">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube player"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>
      )}
      {block.title && embed && (
        <figcaption className="mt-2 text-[11px] opacity-50">
          {block.title}
          {block.artist ? ` — ${block.artist}` : ""}
        </figcaption>
      )}
    </figure>
  );
}

export function BlogBlocks({
  rawBlocks,
  autoAds,
  category,
  tags,
}: {
  rawBlocks: unknown;
  autoAds: boolean;
  category?: string;
  tags?: string[];
}) {
  const blocks = normalizeBlocks(rawBlocks);
  const rendered = autoAds ? insertAutomaticAds(blocks) : blocks;

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip text-[15px] leading-relaxed break-words opacity-90 [overflow-wrap:anywhere]">
      {rendered.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">
                {renderInlineLinks(block.text)}
              </p>
            );
          case "link":
            return (
              <div
                key={index}
                className="my-8 min-w-0 max-w-full overflow-hidden rounded-2xl border border-yellow/25 bg-yellow/[0.04] p-5 text-center"
              >
                {block.description && (
                  <p className="text-[13px] leading-relaxed break-words opacity-75 [overflow-wrap:anywhere]">
                    {block.description}
                  </p>
                )}
                <a
                  href={block.url}
                  target="_blank"
                  rel={
                    block.sponsored
                      ? "noopener noreferrer sponsored nofollow"
                      : "noopener noreferrer"
                  }
                  className="mt-3 inline-block max-w-full rounded-full bg-foreground px-6 py-3 text-[11px] font-medium break-all uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-85"
                >
                  {block.label || block.url}
                </a>
              </div>
            );
          case "heading":
            return block.level === 2 ? (
              <h2 key={index} className="pt-4 font-display text-2xl font-semibold md:text-3xl">
                {block.text}
              </h2>
            ) : block.level === 3 ? (
              <h3 key={index} className="pt-2 font-display text-xl font-semibold md:text-2xl">
                {block.text}
              </h3>
            ) : (
              <h4 key={index} className="pt-2 font-display text-lg font-semibold">
                {block.text}
              </h4>
            );
          case "image":
            return (
              <figure key={index} className="my-8 min-w-0 max-w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.src}
                  alt={block.alt}
                  className="h-auto w-full max-w-full rounded-2xl"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-[11px] leading-relaxed break-words opacity-50 [overflow-wrap:anywhere]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "gallery":
            return (
              <div key={index} className="my-8 grid min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden sm:grid-cols-2">
                {block.images.map((image, imageIndex) => (
                  <figure key={imageIndex} className="min-w-0 max-w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.src}
                      alt={image.alt ?? ""}
                      className="h-auto w-full max-w-full rounded-2xl object-cover"
                    />
                    {image.caption && (
                      <figcaption className="mt-2 text-[11px] opacity-50">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            );
          case "music":
            return <MusicEmbed key={index} block={block} />;
          case "youtube":
            return (
              <figure key={index} className="my-8 min-w-0 max-w-full overflow-hidden">
                <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-foreground/10">
                  <iframe
                    src={`https://www.youtube.com/embed/${block.videoId}`}
                    title="YouTube video"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="aspect-video w-full"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-2 text-[11px] opacity-50">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          case "video":
            return (
              <figure key={index} className="my-8 min-w-0 max-w-full overflow-hidden">
                <video
                  controls
                  preload="metadata"
                  poster={block.thumbnailUrl}
                  className="w-full max-w-full rounded-2xl"
                >
                  <source src={block.url} />
                </video>
                {(block.title || block.caption) && (
                  <figcaption className="mt-2 text-[11px] opacity-50">
                    {block.title}
                    {block.caption ? ` — ${block.caption}` : ""}
                  </figcaption>
                )}
              </figure>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-2 border-yellow/60 py-1 pl-5 font-display text-lg italic leading-relaxed"
              >
                {block.text}
                {block.author && (
                  <footer className="mt-2 font-sans text-[11px] uppercase not-italic tracking-[0.2em] opacity-50">
                    {block.author}
                  </footer>
                )}
              </blockquote>
            );
          case "advertisement":
            return (
              <AdSlot
                key={index}
                slot={block.slot}
                category={category}
                tags={tags}
              />
            );
          case "divider":
            return <hr key={index} className="border-foreground/15" />;
          case "embed":
            return block.html ? (
              <div key={index} className="min-w-0 max-w-full overflow-hidden [&_iframe]:max-w-full" dangerouslySetInnerHTML={{ __html: block.html }} />
            ) : block.url ? (
              <p key={index} className="min-w-0 max-w-full">
                <a
                  href={block.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 break-all hover:text-yellow"
                >
                  {block.url}
                </a>
              </p>
            ) : null;
          default:
            return null;
        }
      })}
    </div>
  );
}
