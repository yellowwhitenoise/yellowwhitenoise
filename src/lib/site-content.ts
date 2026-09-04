import { legalSections } from "@/lib/legal";

export interface ContactEntry {
  label: string;
  email: string;
  note?: string;
}

export interface LegalSectionData {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface SiteContent {
  about: { paragraphs: string[] };
  contact: { entries: ContactEntry[] };
  legal: { sections: LegalSectionData[] };
  socials: { links: SocialLink[] };
}

export const defaultSocialLinks: SocialLink[] = [
  { label: "Instagram", url: "https://www.instagram.com/yellowwhitenoise" },
  { label: "Facebook", url: "https://www.facebook.com/yellowwhitenoise" },
  { label: "TikTok", url: "https://www.tiktok.com/@yellowwhitenoise" },
  { label: "X", url: "https://x.com/yellowwhitenoise" },
  { label: "Threads", url: "https://www.threads.net/@yellowwhitenoise" },
  { label: "YouTube", url: "https://www.youtube.com/@yellowwhitenoise" },
];

export const defaultSiteContent: SiteContent = {
  about: {
    paragraphs: [
      "Yellow White Noise is an independent label built on two ideas: patience and momentum. Home to Muddledsea's late-night Amapiano and Coaltonic's club-built Afrobeats, the label treats every release as a world of its own — crafted slowly, released deliberately.",
      "The name is the sound: yellow, like the last hour of the night; white noise, like the hum a city makes when everyone else is asleep. No faces, no frontmen — just records engineered to hold a room, a drive, or a pair of headphones.",
    ],
  },
  contact: {
    entries: [
      { label: "General", email: "info@yellowwhitenoise.com" },
      {
        label: "Demos",
        email: "demos@yellowwhitenoise.com",
        note: "Send a private streaming link. We listen to everything — expect a reply only if it moves us.",
      },
      { label: "Bookings", email: "bookings@yellowwhitenoise.com" },
    ],
  },
  legal: { sections: legalSections },
  socials: { links: defaultSocialLinks },
};
