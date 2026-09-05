"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ZoomableImage } from "@/components/ZoomableImage";

export function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] isolate flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="absolute inset-0 z-0 bg-black/85"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        autoFocus
        className="absolute right-4 top-4 z-20 cursor-pointer text-[10px] uppercase tracking-[0.18em] text-white/75 transition-colors hover:text-white"
      >
        Close
      </button>
      <div className="relative z-10">
        <ZoomableImage src={src} alt={alt} />
      </div>
    </div>,
    document.body,
  );
}
