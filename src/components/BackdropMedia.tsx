import type { MediaRef } from "@/lib/data";
import { MpegTsVideo } from "@/components/MpegTsVideo";
import { PingPongVideo } from "@/components/PingPongVideo";

function isMpegTs(src: string): boolean {
  return src.split("?")[0].toLowerCase().endsWith(".ts");
}

export function BackdropMedia({
  media,
  from,
  to,
  className,
}: {
  media?: MediaRef;
  from?: string;
  to?: string;
  className?: string;
}) {
  if (media?.type === "video") {
    const playbackSrc = media.playbackSrc ?? media.src;
    if (media.loopBackwards && media.reverseSrc && media.playbackSrc) {
      return (
        <PingPongVideo
          key={`${media.playbackSrc}:${media.reverseSrc}`}
          src={media.playbackSrc}
          reverseSrc={media.reverseSrc}
          className={className}
          autoPlay
          muted
          loop
          loopBackwards
        />
      );
    }
    if (isMpegTs(playbackSrc)) {
      return (
        <MpegTsVideo
          src={playbackSrc}
          className={className}
          autoPlay
          muted
          loop
        />
      );
    }
    return (
      <PingPongVideo
        className={className}
        src={playbackSrc}
        autoPlay
        muted
        loop
      />
    );
  }
  if (media?.type === "image") {
    return (
      <div
        className={`h-full w-full bg-cover bg-center ${className ?? ""}`}
        style={{ backgroundImage: `url(${media.src})` }}
      />
    );
  }
  return (
    <div
      className={`h-full w-full ${className ?? ""}`}
      style={{
        backgroundImage: `linear-gradient(115deg, ${from ?? "#23262e"}, ${to ?? "#101318"})`,
      }}
    />
  );
}
