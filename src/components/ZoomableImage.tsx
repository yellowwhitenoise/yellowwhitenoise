"use client";

import { useRef, useState, type PointerEvent } from "react";

interface Offset {
  x: number;
  y: number;
}

interface PointerStart {
  x: number;
  y: number;
  offset: Offset;
  moved: boolean;
}

export function ZoomableImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const pointerStart = useRef<PointerStart | null>(null);
  const lastTap = useRef<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const bounds = () => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!viewport || !image) return { x: 0, y: 0 };
    return {
      x: Math.max(0, (image.offsetWidth * 2 - viewport.clientWidth) / 2),
      y: Math.max(0, (image.offsetHeight * 2 - viewport.clientHeight) / 2),
    };
  };

  const reset = () => {
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
    lastTap.current = null;
  };

  const toggleZoom = () => {
    if (zoomed) reset();
    else {
      setZoomed(true);
      setOffset({ x: 0, y: 0 });
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const start = pointerStart.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) start.moved = true;
    if (!zoomed) return;
    const limit = bounds();
    setOffset({
      x: Math.max(-limit.x, Math.min(limit.x, start.offset.x + deltaX)),
      y: Math.max(-limit.y, Math.min(limit.y, start.offset.y + deltaY)),
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start?.moved) return;
    const previousTap = lastTap.current;
    if (previousTap !== null && event.timeStamp - previousTap < 320) {
      toggleZoom();
      lastTap.current = null;
    } else {
      lastTap.current = event.timeStamp;
    }
  };

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      role="button"
      aria-label={`${alt}. Activate to ${zoomed ? "reset zoom" : "zoom in"}.`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleZoom();
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClick={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      className="relative max-h-[85dvh] max-w-[90vw] touch-none select-none overflow-hidden rounded-xl bg-[#14120d] opacity-100"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        draggable={false}
        className={`pointer-events-none block max-h-[85dvh] max-w-[90vw] select-none object-contain touch-none ${
          zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoomed ? 2 : 1})`,
          transformOrigin: "center center",
        }}
      />
      <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[9px] uppercase tracking-[0.14em] text-white/70">
        {zoomed ? "Double tap to reset · drag to pan" : "Double tap to zoom"}
      </span>
    </div>
  );
}
