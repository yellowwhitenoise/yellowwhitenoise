declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    _fbq?: unknown;
  }
}

let initialized = false;

export function initAds() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (pixelId) {
    const w = window as unknown as Record<string, unknown>;
    if (!w.fbq) {
      const fbq = (...args: unknown[]) => {
        fbq.callQueue.push(args);
      };
      fbq.callQueue = [] as unknown[];
      w.fbq = fbq;
      w._fbq = fbq;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
    window.fbq?.("init", pixelId);
    window.fbq?.("track", "PageView");
  }

  if (adsId) {
    if (!window.gtag) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${adsId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      const gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
      };
      window.gtag = gtag;
    }
    window.gtag?.("js", new Date());
    window.gtag?.("config", adsId);
  }
}

export function trackOutbound(platform: string, entity: string) {
  if (typeof window === "undefined") return;
  window.fbq?.("trackCustom", "PlatformOutbound", { platform, entity });
  window.gtag?.("event", "platform_outbound", { platform, entity });
}
