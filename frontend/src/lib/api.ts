import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Store token from onAuthStateChange so we don't rely on getSession()
// which can fail due to clock skew between client and Supabase server
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Prefer the stored token from onAuthStateChange
  if (_accessToken) {
    console.warn('[api] Using stored token', _accessToken.substring(0, 30) + '...')
    return { Authorization: `Bearer ${_accessToken}` }
  }
  // Fallback to getSession()
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    console.warn('[api] Using session token')
    _accessToken = session.access_token
    return { Authorization: `Bearer ${session.access_token}` }
  }
  console.warn('[api] NO TOKEN AVAILABLE - request will be unauthenticated')
  return {}
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
}
