"use client";

import { useEffect } from "react";

export function StripScrollTop() {
  useEffect(() => {
    const onScrollTop = () => {
      document
        .querySelectorAll<HTMLElement>("[data-scroll-strip]")
        .forEach((element) => {
          element.scrollTo({ left: 0, top: 0, behavior: "smooth" });
        });
    };
    window.addEventListener("ywn:scroll-to-top", onScrollTop);
    return () => window.removeEventListener("ywn:scroll-to-top", onScrollTop);
  }, []);

  return null;
}
