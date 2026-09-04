"use client";

import { useEffect, useRef, useState } from "react";

function startPlayback(video: HTMLVideoElement) {
  const result = video.play();
  if (result instanceof Promise) result.catch(() => undefined);
}

export function PingPongVideo({
  src,
  reverseSrc,
  className,
  controls = false,
  autoPlay = true,
  muted = true,
  loop = true,
  loopBackwards = false,
}: {
  src: string;
  reverseSrc?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  loopBackwards?: boolean;
}) {
  const forwardRef = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<"forward" | "reverse">("forward");
  const pingPong = Boolean(loop && loopBackwards && reverseSrc);

  useEffect(() => {
    if (!pingPong) return;
    const forward = forwardRef.current;
    const reverse = reverseRef.current;
    if (!forward || !reverse) return;

    const onForwardEnded = () => {
      reverse.currentTime = 0;
      setActive("reverse");
      startPlayback(reverse);
    };
    const onReverseEnded = () => {
      forward.currentTime = 0;
      setActive("forward");
      startPlayback(forward);
    };

    forward.addEventListener("ended", onForwardEnded);
    reverse.addEventListener("ended", onReverseEnded);
    forward.loop = false;
    reverse.loop = false;
    if (autoPlay) startPlayback(forward);

    return () => {
      forward.removeEventListener("ended", onForwardEnded);
      reverse.removeEventListener("ended", onReverseEnded);
      forward.pause();
      reverse.pause();
    };
  }, [autoPlay, pingPong]);

  if (!pingPong) {
    return (
      <video
        ref={forwardRef}
        className={`h-full w-full object-cover ${className ?? ""}`}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
      />
    );
  }

  return (
    <div className={`grid h-full w-full ${className ?? ""}`}>
      <video
        ref={forwardRef}
        className={`col-start-1 row-start-1 h-full w-full object-cover ${
          active === "forward"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
      />
      <video
        ref={reverseRef}
        className={`col-start-1 row-start-1 h-full w-full object-cover ${
          active === "reverse"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        src={reverseSrc}
        controls={controls}
        muted={muted}
        playsInline
        preload="auto"
      />
    </div>
  );
}
