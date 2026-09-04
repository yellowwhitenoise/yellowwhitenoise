export function Wordmark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/ywn-logo.png"
      alt="Yellow White Noise"
      className={className ?? "h-16 w-auto max-w-[min(110px,28vw)] object-contain"}
    />
  );
}
