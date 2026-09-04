const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, "");

export function isBackendConfigured(): boolean {
  return Boolean(backendUrl);
}

export async function fetchBackendJson<T>(pathname: string): Promise<T | null> {
  if (!backendUrl) return null;
  try {
    const response = await fetch(`${backendUrl}${pathname}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
