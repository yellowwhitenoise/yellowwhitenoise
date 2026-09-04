export interface PreparedVideo {
  playbackUrl: string;
  reverseUrl: string;
}

export async function prepareReverseVideo(src: string): Promise<PreparedVideo> {
  const response = await fetch("/api/admin/media/reverse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ src }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    playbackUrl?: string;
    reverseUrl?: string;
    error?: string;
  };
  if (!response.ok || !data.playbackUrl || !data.reverseUrl) {
    throw new Error(data.error ?? "Could not prepare reverse playback.");
  }
  return { playbackUrl: data.playbackUrl, reverseUrl: data.reverseUrl };
}
