import { del, get, post } from './api'

export interface DashboardSnapshot {
  generatedAt: string
  uptimeSeconds: number
  outbox: {
    pending: number
    processing: number
    failed: number
    deadLetter: number
    sent: number
  }
  webhooks: {
    payment: {
      processing: number
      failed: number
      processed: number
    }
    whatsapp: {
      events24h: number
      events30d: number
    }
  }
  conversations: {
    invoiceActive: number
    searchActive: number
  }
  integrations: {
    whatsapp: {
      failures: number
      avgLatencyMs: number
      p95LatencyMs: number
    }
    mercadopago: {
      failures: number
      avgLatencyMs: number
      p95LatencyMs: number
    }
  }
  emailPipeline: {
    sendSuccess: number
    sendFailures: number
    avgSendMs: number
    p95SendMs: number
  }
}

export interface MetricPoint {
  timestamp: string
  value: number
}

export interface MetricSeries {
  metric: string
  label: string
  points: MetricPoint[]
}

export interface TimeseriesSnapshot {
  from: string
  to: string
  stepMinutes: number
  series: MetricSeries[]
}

export interface TimeseriesParams {
  metrics?: string[]
  from?: string
  to?: string
  stepMinutes?: number
}

export interface OutboxStatsResponse {
  pending: number
  processing: number
  failed: number
  sent: number
  dead_letter: number
}

export interface RequeueDeadLetterResponse {
  requeued: number
}

export interface DeadLetterItem {
  id: string
  toAddresses: string
  subject: string
  attemptCount: number
  lastError: string | null
  nextAttemptAt: string
  createdAt: string
  updatedAt: string
}

export interface DeadLetterPageResponse {
  page: number
  size: number
  totalElements: number
  totalPages: number
  items: DeadLetterItem[]
}

export interface InvoiceQueueStats {
  queued: number
  processing: number
  emitted: number
  failed: number
  cancelled: number
}

export interface InvoiceQueueItem {
  id: string
  externalId: string
  cuit: string
  status: string
  emisor: string
  puntoVenta?: number | null
  fechaEmision?: string | null
  concepto?: string | null
  total?: number | null
  attemptCount: number
  nextAttemptAt: string
  lastError?: string | null
  emittedAt?: string | null
  createdAt: string
  updatedAt: string
  attempts: InvoiceQueueAttempt[]
}

export interface InvoiceQueueAttempt {
  attemptNumber: number
  status: string
  resultado?: string | null
  createdAt: string
  errorMessage?: string | null
}

export interface InvoiceQueuePageResponse {
  page: number
  size: number
  totalElements: number
  totalPages: number
  stats: InvoiceQueueStats
  items: InvoiceQueueItem[]
}

export interface WhatsAppHistoryItem {
  id: string
  phone: string
  direction: string
  status: string
  messageType: string | null
  messageId: string | null
  textPreview: string | null
  payloadJson: string
  createdAt: string
}

export interface WhatsAppHistoryPageResponse {
  page: number
  size: number
  totalElements: number
  totalPages: number
  items: WhatsAppHistoryItem[]
}

export interface WhatsAppHistoryParams {
  page?: number
  size?: number
  phone?: string
  direction?: string
  status?: string
  from?: string
  to?: string
}

export const OpsService = {
  dashboard: () => get<DashboardSnapshot>('/api/admin/ops/dashboard'),
  timeseries: ({ metrics, from, to, stepMinutes }: TimeseriesParams = {}) => {
    const query = new URLSearchParams()
    if (metrics?.length) {
      query.set('metrics', metrics.join(','))
    }
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    if (stepMinutes) query.set('stepMinutes', String(stepMinutes))
    const suffix = query.toString()
    return get<TimeseriesSnapshot>(`/api/admin/ops/timeseries${suffix ? `?${suffix}` : ''}`)
  },
  outboxStats: () => get<OutboxStatsResponse>('/api/admin/outbox/stats'),
  requeueOutboxById: (id: string) =>
    post<void>(`/api/admin/outbox/${encodeURIComponent(id)}/requeue`),
  deleteOutboxById: (id: string) =>
    del<void>(`/api/admin/outbox/${encodeURIComponent(id)}`),
  requeueDeadLetter: (limit = 50) =>
    post<RequeueDeadLetterResponse>(`/api/admin/outbox/requeue-dead-letter?limit=${encodeURIComponent(limit)}`),
  deadLetter: (page = 0, size = 25) =>
    get<DeadLetterPageResponse>(`/api/admin/outbox/dead-letter?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`),
  invoiceQueue: (page = 0, size = 25) =>
    get<InvoiceQueuePageResponse>(`/api/admin/ops/invoice-queue?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`),
  whatsappHistory: ({ page = 0, size = 25, phone, direction, status, from, to }: WhatsAppHistoryParams = {}) => {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('size', String(size))
    if (phone) query.set('phone', phone)
    if (direction) query.set('direction', direction)
    if (status) query.set('status', status)
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    return get<WhatsAppHistoryPageResponse>(`/api/admin/whatsapp/history?${query.toString()}`)
  }
}
