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

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function handle(res: Response) {
  if (res.status === 401) {
    interceptor?.onUnauthorized?.()
  }
  if (!res.ok) {
    let payload: unknown = undefined
    let message = res.statusText || 'Error'
    const body = await res.text().catch(() => '')
    if (body) {
      try {
        payload = JSON.parse(body)
      } catch (err) {
        payload = body
      }

      if (typeof payload === 'object' && payload !== null) {
        const maybeMessage = (payload as any).message ?? (payload as any).error
        if (typeof maybeMessage === 'string') {
          message = maybeMessage
        }
      } else if (typeof payload === 'string') {
        message = payload
      }
    }

    throw new ApiError(res.status, message, payload)
  }
  const ct = res.headers.get('content-type')?.toLowerCase() ?? ''
  if (ct.includes('application/json')) {
    return res.json()
  }
  if (ct.startsWith('text/')) {
    return res.text()
  }
  return res.arrayBuffer()
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
