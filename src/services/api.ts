const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

type AuthInterceptor = {
  getToken: () => string | null
  isTokenExpired?: () => boolean
  onUnauthorized?: () => void
}

let interceptor: AuthInterceptor | null = null

export function registerAuthInterceptor(next: AuthInterceptor | null) {
  interceptor = next
}

async function handle(res: Response) {
  if (res.status === 401) {
    interceptor?.onUnauthorized?.()
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.json().catch(async () => res.text())
}

type RequestOptions = RequestInit & { body?: any }

async function request<T>(url: string, options: RequestOptions): Promise<T> {
  if (interceptor?.isTokenExpired?.()) {
    interceptor.onUnauthorized?.()
    throw new Error('La sesión expiró. Vuelve a iniciar sesión.')
  }

  const headers = new Headers(options.headers ?? undefined)

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    const jsonBody = typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    options = { ...options, body: jsonBody }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  if (interceptor?.getToken) {
    const token = interceptor.getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    credentials: options.credentials ?? 'include',
    headers
  })

  return handle(res) as Promise<T>
}

export async function get<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  return request<T>(url, { ...(init ?? {}), method: 'GET' })
}

export async function post<T = unknown>(url: string, body?: any, init?: RequestInit): Promise<T> {
  return request<T>(url, { ...(init ?? {}), method: 'POST', body })
}
