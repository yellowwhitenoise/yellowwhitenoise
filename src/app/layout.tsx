import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { AdsInit } from "@/components/AdsInit";
import { CookieConsent } from "@/components/CookieConsent";
import { GrainOverlay } from "@/components/GrainOverlay";
import { PushPrompt } from "@/components/PushPrompt";
import { SubscribeModal } from "@/components/SubscribeModal";
import { UtmCapture } from "@/components/UtmCapture";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const SITE_URL = "https://www.yellowwhitenoise.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Yellow White Noise — Independent Amapiano & Afrobeats Label",
    template: "%s — Yellow White Noise",
  },
  description:
    "Yellow White Noise is an independent label home for Muddledsea (Amapiano) and Coaltonic (Afrobeats) — stream tracks, albums and curated playlists.",
  keywords: [
    "Yellow White Noise",
    "Muddledsea",
    "Coaltonic",
    "Amapiano",
    "Afrobeats",
    "music label",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: "Yellow White Noise",
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14120d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-background font-sans text-foreground"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Yellow White Noise",
              url: SITE_URL,
              description:
                "Independent label home for Muddledsea (Amapiano) and Coaltonic (Afrobeats).",
            }),
          }}
        />
        <UtmCapture />
        <AdsInit />
        {children}
        <CookieConsent />
        <SubscribeModal />
        <PushPrompt />
        <GrainOverlay />
      </body>
    </html>
  );
}
