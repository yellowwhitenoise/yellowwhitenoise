import { sanitizeLogoUrl } from "@/lib/sanitize";

export const EMAIL_TEMPLATE_TYPES = [
  "song",
  "album",
  "ep",
  "comingSoon",
  "playlist",
  "playlistTrack",
] as const;

export type NotifyType = (typeof EMAIL_TEMPLATE_TYPES)[number];

export interface EmailTemplate {
  subject: string;
  html: string;
}

export const DEFAULT_EMAIL_TEMPLATES: Record<NotifyType, EmailTemplate> = {
  song: {
    subject: "New track: {{title}} — Yellow White Noise",
    html: `<p>{{intro}}</p>
{{coverImage}}
<p><strong>{{title}}</strong>{{artistLine}}</p>
{{platformButtons}}
<p><a href="{{url}}" style="display:inline-block;margin-top:12px;background:#f0b429;color:#14120d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:999px;">Listen now</a></p>`,
  },
  album: {
    subject: "New album: {{title}} — Yellow White Noise",
    html: `<p>{{intro}}</p>
{{coverImage}}
<p><strong>{{title}}</strong>{{artistLine}}</p>
<p>Hear the full release wherever you listen.</p>
{{platformButtons}}
<p><a href="{{url}}" style="display:inline-block;margin-top:12px;background:#f0b429;color:#14120d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:999px;">Listen now</a></p>`,
  },
  ep: {
    subject: "New EP: {{title}} — Yellow White Noise",
    html: `<p>{{intro}}</p>
{{coverImage}}
<p><strong>{{title}}</strong>{{artistLine}}</p>
<p>Hear the full EP wherever you listen.</p>
{{platformButtons}}
<p><a href="{{url}}" style="display:inline-block;margin-top:12px;background:#f0b429;color:#14120d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:999px;">Listen now</a></p>`,
  },
  playlist: {
    subject: "New playlist: {{title}} — Yellow White Noise",
    html: `<p>{{intro}}</p>
{{coverImage}}
<p><strong>{{title}}</strong>{{artistLine}}</p>
<p>A new selection for your rotation.</p>
{{platformButtons}}
<p><a href="{{url}}" style="display:inline-block;margin-top:12px;background:#f0b429;color:#14120d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:999px;">Open playlist</a></p>`,
  },
  comingSoon: {
    subject: "Coming soon: {{title}} — Yellow White Noise",
    html: `<p>{{intro}}</p>
{{coverImage}}
<p><strong>{{title}}</strong>{{artistLine}}</p>
<p>From the forthcoming {{typeLabel}} — watch this space.</p>
{{platformButtons}}`,
  },
  playlistTrack: {
    subject: "New track added to {{playlistName}}: {{title}}",
    html: `<p>{{intro}}</p>
<p><strong>{{playlistName}}</strong> has a new addition:</p>
{{trackList}}
<p><a href="{{url}}" style="display:inline-block;margin-top:12px;background:#f0b429;color:#14120d;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:999px;">Open playlist</a></p>`,
  },
};

export const EMAIL_TEMPLATE_KEYS: Record<NotifyType, string> = {
  song: "email_template_song",
  album: "email_template_album",
  ep: "email_template_ep",
  comingSoon: "email_template_coming_soon",
  playlist: "email_template_playlist",
  playlistTrack: "email_template_playlist_track",
};

export function replaceEmailTokens(
  value: string,
  tokens: Record<string, string>,
): string {
  return value.replace(/\{\{([a-zA-Z]+)\}\}/g, (match, key: string) => {
    return tokens[key] ?? match;
  });
}

export function emailHeaderHtml(logoUrl?: string): string {
  if (logoUrl) {
    return `<div style="text-align:center;padding-bottom:32px;">
      <img src="${logoUrl}" alt="Yellow White Noise" width="110" style="display:inline-block;width:110px;height:auto;border:0;outline:none;" />
    </div>`;
  }
  return `<div style="text-align:center;padding-bottom:32px;">
      <div style="color:#f0b429;font-size:13px;font-weight:700;letter-spacing:8px;text-transform:uppercase;">Yellow</div>
      <div style="color:#f5f1e8;font-size:13px;font-weight:700;letter-spacing:8px;text-transform:uppercase;">White</div>
      <div style="color:#f5f1e8;font-size:13px;font-weight:700;letter-spacing:8px;text-transform:uppercase;">Noise</div>
    </div>`;
}

export function emailLayout(
  title: string,
  bodyHtml: string,
  logoUrl?: string,
): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0b0a08;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    ${emailHeaderHtml(logoUrl)}
    <div style="background:#14120d;border:1px solid rgba(240,180,41,0.2);border-radius:24px;padding:40px 32px;text-align:center;">
      <h1 style="margin:0;color:#f5f1e8;font-size:24px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">${title}</h1>
      <div style="margin-top:20px;color:rgba(245,241,232,0.75);font-size:15px;line-height:1.6;">${bodyHtml}</div>
    </div>
    <div style="text-align:center;padding-top:28px;color:rgba(245,241,232,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;">
      © 2026 Yellow White Noise · <a href="{{unsubscribe}}" style="color:rgba(245,241,232,0.35);">Unsubscribe</a>
    </div>
  </div>
</body></html>`;
}

const PREVIEW_TOKENS = {
  title: "Example Release",
  artist: "Example Artist",
  artistLine: " by Example Artist",
  typeLabel: "track",
  playlistName: "Yellow Hours",
  intro: "A new track just landed on the label.",
  url: "https://www.yellowwhitenoise.com",
  trackList:
    '<ul style="margin:16px 0;padding-left:20px;text-align:left;"><li><strong>Example Track</strong> by Example Artist</li></ul>',
  unsubscribe: "#unsubscribe",
};

export function previewEmailHtml(
  template: EmailTemplate,
  logoUrl?: string,
): string {
  const body = replaceEmailTokens(template.html, PREVIEW_TOKENS);
  return replaceEmailTokens(
    emailLayout("Example Release", body, sanitizeLogoUrl(logoUrl)),
    PREVIEW_TOKENS,
  );
}
