import type { ReactNode } from "react";
import { ArtistSheet } from "@/components/ArtistSheet";
import { BottomNav } from "@/components/BottomNav";
import { ChromeAutoHide } from "@/components/ChromeAutoHide";
import { SiteLogo } from "@/components/SiteLogo";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ChromeAutoHide />
      <SiteLogo />
      {children}
      <BottomNav />
      <ArtistSheet />
    </>
  );
}
