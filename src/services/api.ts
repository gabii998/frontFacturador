const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

type AuthInterceptor = {
  getToken: () => string | null
  isTokenExpired?: () => boolean
  onUnauthorized?: () => Promise<boolean> | boolean
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

async function triggerUnauthorized(): Promise<boolean> {
  if (!interceptor?.onUnauthorized) return false
  try {
    const result = await interceptor.onUnauthorized()
    return Boolean(result)
  } catch (error) {
    return false
  }
}

async function ensureValidToken(): Promise<boolean> {
  if (!interceptor?.isTokenExpired) {
    return true
  }
  if (!interceptor.isTokenExpired()) {
    return true
  }
  const refreshed = await triggerUnauthorized()
  if (!refreshed) {
    return false
  }
  if (interceptor?.isTokenExpired?.()) {
    return false
  }
  return true
}

async function request<T>(url: string, options: RequestOptions): Promise<T> {
  let attempt = 0

  while (attempt < 2) {
    const authReady = await ensureValidToken()
    if (!authReady) {
      throw new Error('La sesión expiró. Vuelve a iniciar sesión.')
    }

    let requestOptions: RequestOptions = { ...options }
    const headers = new Headers(requestOptions.headers ?? undefined)

    if (requestOptions.body !== undefined && !(requestOptions.body instanceof FormData)) {
      const jsonBody = typeof requestOptions.body === 'string' ? requestOptions.body : JSON.stringify(requestOptions.body)
      requestOptions = { ...requestOptions, body: jsonBody }
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
      ...requestOptions,
      credentials: requestOptions.credentials ?? 'include',
      headers
    })

    if (res.status === 401 && attempt === 0) {
      const refreshed = await triggerUnauthorized()
      if (refreshed) {
        attempt += 1
        continue
      }
    }

    return handle(res) as Promise<T>
  }

  throw new Error('La sesión expiró. Vuelve a iniciar sesión.')
}

export async function get<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  return request<T>(url, { ...(init ?? {}), method: 'GET' })
}

export async function post<T = unknown>(url: string, body?: any, init?: RequestInit): Promise<T> {
  return request<T>(url, { ...(init ?? {}), method: 'POST', body })
}
