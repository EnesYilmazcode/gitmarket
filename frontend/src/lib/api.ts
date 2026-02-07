import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Store token from onAuthStateChange so we don't rely on getSession()
// which can fail due to clock skew between client and Supabase server
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (_accessToken) {
    return { Authorization: `Bearer ${_accessToken}` }
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    _accessToken = session.access_token
    return { Authorization: `Bearer ${session.access_token}` }
  }
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

  // If 401 and we had a token, it probably expired — refresh and retry once
  if (res.status === 401 && _accessToken) {
    _accessToken = null
    const { data: { session } } = await supabase.auth.refreshSession()
    if (session?.access_token) {
      _accessToken = session.access_token
      const retry = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers,
        },
      })
      if (!retry.ok) {
        const error = await retry.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail || `HTTP ${retry.status}`)
      }
      return retry.json()
    }
  }

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
