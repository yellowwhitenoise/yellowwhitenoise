"use client";

import { useEffect, useRef } from "react";

interface TsPlayer {
  attachMediaElement(element: HTMLMediaElement): void;
  detachMediaElement(): void;
  load(): void;
  unload(): void;
  destroy(): void;
  pause?(): void;
  play(): Promise<void> | void;
}

interface TsModule {
  isSupported(): boolean;
  createPlayer(
    source: { type: string; isLive?: boolean; url?: string },
    config?: { enableWorker?: boolean; lazyLoad?: boolean },
  ): TsPlayer;
}

export function MpegTsVideo({
  src,
  className,
  controls = false,
  autoPlay = true,
  muted = true,
  loop = true,
}: {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let player: TsPlayer | null = null;

    const play = () => {
      if (!player) return;
      const result = player.play();
      if (result instanceof Promise) result.catch(() => undefined);
    };

    const onEnded = () => {
      if (disposed || !loop || !player) return;
      player.unload();
      player.load();
      play();
    };

    const start = async () => {
      const mpegtsModule = (await import("mpegts.js")).default as TsModule;
      if (disposed || !mpegtsModule.isSupported()) return;
      player = mpegtsModule.createPlayer(
        { type: "mpegts", isLive: false, url: src },
        { enableWorker: false, lazyLoad: false },
      );
      player.attachMediaElement(video);
      player.load();
      video.addEventListener("ended", onEnded);
      if (autoPlay) play();
    };

    video.muted = muted;
    video.autoplay = autoPlay;
    video.loop = loop;
    video.playsInline = true;
    void start();

    return () => {
      disposed = true;
      video.removeEventListener("ended", onEnded);
      if (player) {
        player.pause?.();
        player.unload();
        player.detachMediaElement();
        player.destroy();
      }
    };
  }, [autoPlay, loop, muted, src]);

  return (
    <video
      ref={videoRef}
      className={`h-full w-full object-cover ${className ?? ""}`}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline
    >
      <source src={src} type="video/mp2t" />
    </video>
  );
}
