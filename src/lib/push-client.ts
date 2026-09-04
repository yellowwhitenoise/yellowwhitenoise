export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(raw.length),
  );
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

async function ensureRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register("/sw.js");
}

export async function getPushConfig(): Promise<{
  publicKey: string | null;
  configured: boolean;
}> {
  try {
    const response = await fetch("/api/push/config");
    if (!response.ok) return { publicKey: null, configured: false };
    return (await response.json()) as {
      publicKey: string | null;
      configured: boolean;
    };
  } catch {
    return { publicKey: null, configured: false };
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await ensureRegistration();
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export function getLocalPlaylistSlugs(): string[] {
  try {
    const raw = localStorage.getItem("ywn-push-playlists");
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function setLocalPlaylistSlugs(slugs: string[]): void {
  localStorage.setItem("ywn-push-playlists", JSON.stringify(slugs));
}

export async function subscribePush(
  playlists: string[] = [],
): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const { publicKey, configured } = await getPushConfig();
  if (!configured || !publicKey) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const registration = await ensureRegistration();
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), playlists }),
  });
  if (!response.ok) return null;
  setLocalPlaylistSlugs(playlists);
  localStorage.setItem("ywn-push-enabled", "1");
  return subscription;
}

export async function unsubscribePush(): Promise<void> {
  const subscription = await getExistingSubscription();
  const endpoint = subscription?.endpoint;
  if (endpoint) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => undefined);
  }
  await subscription?.unsubscribe().catch(() => undefined);
  localStorage.removeItem("ywn-push-enabled");
}

export async function setPushPlaylists(slugs: string[]): Promise<boolean> {
  const subscription = await getExistingSubscription();
  if (!subscription) return false;
  const response = await fetch("/api/push/subscription", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint, playlists: slugs }),
  });
  if (!response.ok) return false;
  setLocalPlaylistSlugs(slugs);
  return true;
}
