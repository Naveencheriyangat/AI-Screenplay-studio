export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export async function aiAction<T>(projectId: string, action: string, payload: Record<string, unknown> = {}) {
  const data = await api<{ provider: string; action: string; result: T }>(`/api/projects/${projectId}/ai`, {
    method: "POST",
    body: JSON.stringify({ action, payload }),
  });
  return data.result;
}
