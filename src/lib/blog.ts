export type { BlogBlock } from "@/lib/blocks";

export interface BlogPost {
  slug: string;
  title: string;
  brief: string;
  date: string;
  heroImage?: string;
  heroPalette: { from: string; to: string };
}
