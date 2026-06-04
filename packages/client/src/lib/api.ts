const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? ''

async function request(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body: unknown) => request('POST', path, body),
  del: (path: string) => request('DELETE', path),
}
