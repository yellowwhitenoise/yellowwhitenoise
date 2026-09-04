"use client";

import { useEffect, useRef, useState, type TouchEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ResponsiveMenu({
  label,
  activeLabel,
  trigger,
  mobilePresentation = "sheet",
  buttonClassName,
  menuClassName,
  align = "left",
  children,
}: {
  label: string;
  activeLabel?: string;
  trigger?: ReactNode;
  mobilePresentation?: "sheet" | "center";
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    setPullY(0);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onTouchStart = (event: TouchEvent) => {
    startY.current = event.touches[0].clientY;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (startY.current === null) return;
    const sheet = sheetRef.current;
    // If the sheet content is scrolled, the gesture is a scroll — not a
    // dismiss. Translating the sheet at the same time fights native
    // scrolling and causes the jitter.
    if (sheet && sheet.scrollTop > 0) {
      if (pullY !== 0) setPullY(0);
      return;
    }
    const delta = event.touches[0].clientY - startY.current;
    // Small threshold so resting fingers / scroll noise don't move the sheet.
    if (delta < 10) {
      if (pullY !== 0) setPullY(0);
      return;
    }
    setPullY(delta);
  };

  const onTouchEnd = () => {
    if (pullY > 90) close();
    else setPullY(0);
    startY.current = null;
  };

  const sheet =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[80] md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={close} />
            <div
              ref={sheetRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={
                mobilePresentation === "sheet" && pullY !== 0
                  ? { transform: `translateY(${pullY}px)`, transition: "none" }
                  : mobilePresentation === "sheet"
                    ? { transition: "transform 0.18s ease-out" }
                    : undefined
              }
              role="dialog"
              aria-modal="true"
              className={
                mobilePresentation === "center"
                  ? "rise-in absolute left-1/2 top-1/2 max-h-[80dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-3xl bg-background p-6 shadow-2xl"
                  : "sheet-up-in absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-background p-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl"
              }
            >
              {mobilePresentation === "sheet" && (
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/20" />
              )}
              {children(close)}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label={label}
          aria-expanded={open}
          className={buttonClassName}
        >
          {trigger || activeLabel || label}
        </button>

        <div className="hidden md:block">
          {open && (
            <>
              <div className="fixed inset-0 z-20" onClick={close} />
              <div
                className={`absolute z-30 mt-2 w-64 rounded-2xl border border-foreground/15 bg-background p-2 shadow-2xl ${
                  align === "right" ? "right-0" : "left-0"
                } ${menuClassName ?? ""}`}
              >
                {children(close)}
              </div>
            </>
          )}
        </div>
      </div>

      {sheet}
    </>
  );
}
