import type { BlogBlock } from "@/lib/blog";

export interface SeedPost {
  slug: string;
  title: string;
  date: string;
  brief: string;
  heroImage?: string;
  heroPalette: { from: string; to: string };
  body: BlogBlock[];
}

export const seedPosts: SeedPost[] = [
  {
    slug: "inside-yellow-hours",
    title: "Inside Yellow Hours",
    date: "Aug 14, 2026",
    brief:
      "How we sequenced our first playlist for the after-hours — and why it ends where it ends.",
    heroImage: "https://picsum.photos/seed/ywn-yellow-hours/1600/900",
    heroPalette: { from: "#2a3f4d", to: "#101b23" },
    body: [
      {
        type: "paragraph",
        text: "Our first playlist, Yellow Hours, was sequenced like a set, not shuffled like a feed. It opens in the deep end — Low Tide Gospel — because the after-hours don't have an intro; they arrive already in progress.",
      },
      {
        type: "image",
        src: "https://picsum.photos/seed/ywn-sequencing/1400/800",
        alt: "The Yellow Hours sequencing board",
        caption: "The sequencing board for Yellow Hours, third pass.",
      },
      {
        type: "paragraph",
        text: "From there the record breathes outward. Outside tracks were chosen less for tempo than for temperament: each one had to sit still long enough for the log drum to matter. If a song asked for attention, it was cut. If it gave attention, it stayed.",
      },
      {
        type: "paragraph",
        text: "The last track fades without resolving. That's deliberate. Yellow Hours is meant to end the way the after-hours end — not with a finale, but with daylight quietly taking over the mix.",
      },
    ],
  },
  {
    slug: "the-patience-of-amapiano",
    title: "The Patience of Amapiano",
    date: "Jul 2, 2026",
    brief:
      "Why Muddledsea's records refuse to hurry — and why yours shouldn't either.",
    heroPalette: { from: "#1f3a3a", to: "#0f1d1d" },
    body: [
      {
        type: "paragraph",
        text: "Amapiano is often described as slow, but patience is a better word. The genre's signature move is restraint: a groove established early and trusted for minutes at a time, the log drum arriving exactly when it should and no earlier.",
      },
      {
        type: "paragraph",
        text: "Muddledsea writes with that trust. Melodies are sketched rather than stated; shakers carry the momentum so the bass never has to rush. The result is music that reveals itself on the tenth listen, not the first.",
      },
      {
        type: "paragraph",
        text: "In a feed that rewards the immediate, patience is a position. It's the label's position too.",
      },
    ],
  },
  {
    slug: "rhythm-is-a-crowd-instrument",
    title: "Rhythm Is a Crowd Instrument",
    date: "Jun 11, 2026",
    brief: "Coaltonic on writing percussion for the front row.",
    heroPalette: { from: "#5a3a14", to: "#20140a" },
    body: [
      {
        type: "paragraph",
        text: "Every Coaltonic record starts with a simple test: does this pattern make a room of strangers move in the same direction at the same time? If the answer is maybe, the pattern is rewritten.",
      },
      {
        type: "paragraph",
        text: "Percussion is stacked like voices in a choir — bata patterns cut with electronic ticks, shakers answering kicks, each element given its own pocket so the groove stays wide open at any volume.",
      },
      {
        type: "paragraph",
        text: "The crowd is the final instrument. The records are only half-finished until they're played loud, in a room, with people standing in front of the speakers.",
      },
    ],
  },
];
