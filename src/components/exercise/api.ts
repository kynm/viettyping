export async function exerciseApi<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(url, { method, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error ?? 'Không thể kết nối.'), { status: response.status });
  return result;
}
