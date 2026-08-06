import { supabase } from './supabase'

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '')

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiUrl) throw new Error('Configure EXPO_PUBLIC_API_URL.')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sessão expirada. Entre novamente.')
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'Não foi possível concluir a operação.')
  return body as T
}
