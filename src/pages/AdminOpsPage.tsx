import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconActivityHeartbeat } from '@tabler/icons-react'
import SectionHeader from '../components/SectionHeader'
import ErrorBox from '../components/ErrorBox'
import {
  OpsService,
  type DeadLetterPageResponse,
  type DashboardSnapshot,
  type MetricPoint,
  type OutboxStatsResponse,
  type TimeseriesSnapshot
} from '../services/ops'

const DEFAULT_METRICS = [
  'mail.sent.count',
  'mail.deadletter.count',
  'payment.webhook.failed.count',
  'payment.webhook.processed.count',
  'whatsapp.webhook.events.count'
]
const DEAD_LETTER_PAGE_SIZE = 10

function toIsoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function MiniChart({ points }: { points: MetricPoint[] }) {
  const values = points.map((p) => p.value)
  const max = Math.max(1, ...values)
  const width = 220
  const height = 54
  const step = points.length > 1 ? width / (points.length - 1) : width
  const path = points
    .map((point, index) => {
      const x = index * step
      const y = height - (point.value / max) * height
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  if (!path) return <span className="text-xs text-slate-400">Sin datos</span>

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600" />
    </svg>
  )
}

export default function AdminOpsPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [outboxStats, setOutboxStats] = useState<OutboxStatsResponse | null>(null)
  const [series, setSeries] = useState<TimeseriesSnapshot | null>(null)
  const [deadLetterPage, setDeadLetterPage] = useState<DeadLetterPageResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDeadLetter, setLoadingDeadLetter] = useState(false)
  const [loadingOutboxAction, setLoadingOutboxAction] = useState(false)
  const [loadingRowRequeueId, setLoadingRowRequeueId] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [outboxId, setOutboxId] = useState('')
  const [deadLetterLimit, setDeadLetterLimit] = useState('50')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const to = new Date().toISOString()
      const from = toIsoHoursAgo(24)
      const [nextSnapshot, nextSeries, nextOutboxStats] = await Promise.all([
        OpsService.dashboard(),
        OpsService.timeseries({
          metrics: DEFAULT_METRICS,
          from,
          to,
          stepMinutes: 60
        }),
        OpsService.outboxStats()
      ])
      setSnapshot(nextSnapshot)
      setSeries(nextSeries)
      setOutboxStats(nextOutboxStats)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDeadLetter = useCallback(async (page: number) => {
    setLoadingDeadLetter(true)
    setError(null)
    try {
      const next = await OpsService.deadLetter(page, DEAD_LETTER_PAGE_SIZE)
      setDeadLetterPage(next)
    } catch (err) {
      setError(err)
    } finally {
      setLoadingDeadLetter(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void loadDeadLetter(0)
  }, [load, loadDeadLetter])

  const uptimeLabel = useMemo(() => {
    if (!snapshot) return '-'
    const total = Math.max(0, Math.floor(snapshot.uptimeSeconds))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return `${hours}h ${minutes}m`
  }, [snapshot])

  const refreshOutboxStats = useCallback(async () => {
    const next = await OpsService.outboxStats()
    setOutboxStats(next)
  }, [])

  const handleRequeueById = async () => {
    const id = outboxId.trim()
    if (!id) return
    setLoadingOutboxAction(true)
    setError(null)
    setActionMessage(null)
    try {
      await OpsService.requeueOutboxById(id)
      setActionMessage(`Mensaje ${id} reencolado correctamente.`)
      await Promise.all([refreshOutboxStats(), load(), loadDeadLetter(deadLetterPage?.page ?? 0)])
      setOutboxId('')
    } catch (err) {
      setError(err)
    } finally {
      setLoadingOutboxAction(false)
    }
  }

  const handleRequeueDeadLetter = async () => {
    const parsedLimit = Number.parseInt(deadLetterLimit, 10)
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50
    setLoadingOutboxAction(true)
    setError(null)
    setActionMessage(null)
    try {
      const response = await OpsService.requeueDeadLetter(limit)
      setActionMessage(`Se reencolaron ${formatNumber(response.requeued)} mensajes desde dead-letter.`)
      await Promise.all([refreshOutboxStats(), load(), loadDeadLetter(deadLetterPage?.page ?? 0)])
    } catch (err) {
      setError(err)
    } finally {
      setLoadingOutboxAction(false)
    }
  }

  const handleRequeueFromRow = async (id: string) => {
    setLoadingRowRequeueId(id)
    setError(null)
    setActionMessage(null)
    try {
      await OpsService.requeueOutboxById(id)
      setActionMessage(`Mensaje ${id} reencolado correctamente.`)
      await Promise.all([refreshOutboxStats(), load(), loadDeadLetter(deadLetterPage?.page ?? 0)])
    } catch (err) {
      setError(err)
    } finally {
      setLoadingRowRequeueId(null)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        section="Superusuario"
        icon={<IconActivityHeartbeat />}
        title="Dashboard operativo"
        subtitle="Métricas en tiempo real de outbox, webhooks e integraciones."
      />

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {snapshot ? `Actualizado: ${formatDateTime(snapshot.generatedAt)}` : 'Cargando snapshot...'}
          </p>
          <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        <ErrorBox error={error} />

        {snapshot && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Uptime</p>
              <p className="text-xl font-semibold text-slate-900">{uptimeLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Outbox pending</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(snapshot.outbox.pending)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Outbox failed</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(snapshot.outbox.failed)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">DLQ</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(snapshot.outbox.deadLetter)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Pagos webhook failed</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(snapshot.webhooks.payment.failed)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">WhatsApp 24h</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(snapshot.webhooks.whatsapp.events24h)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">WA avg latency</p>
              <p className="text-xl font-semibold text-slate-900">{Math.round(snapshot.integrations.whatsapp.avgLatencyMs)} ms</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">MP p95 latency</p>
              <p className="text-xl font-semibold text-slate-900">{Math.round(snapshot.integrations.mercadopago.p95LatencyMs)} ms</p>
            </div>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Outbox admin</h2>
        {outboxStats && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Pending</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(outboxStats.pending)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Processing</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(outboxStats.processing)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Failed</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(outboxStats.failed)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Sent</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(outboxStats.sent)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Dead letter</p>
              <p className="text-xl font-semibold text-slate-900">{formatNumber(outboxStats.dead_letter)}</p>
            </div>
          </div>
        )}

        {actionMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <p className="text-sm font-semibold text-slate-800">Reencolar por ID</p>
            <input
              type="text"
              className="input"
              placeholder="UUID del mensaje outbox"
              value={outboxId}
              onChange={(event) => setOutboxId(event.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={loadingOutboxAction || !outboxId.trim()}
              onClick={() => void handleRequeueById()}
            >
              {loadingOutboxAction ? 'Procesando...' : 'Reencolar ID'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 space-y-3">
            <p className="text-sm font-semibold text-slate-800">Reencolar lote dead-letter</p>
            <input
              type="number"
              min={1}
              className="input"
              value={deadLetterLimit}
              onChange={(event) => setDeadLetterLimit(event.target.value)}
            />
            <button
              type="button"
              className="btn"
              disabled={loadingOutboxAction}
              onClick={() => void handleRequeueDeadLetter()}
            >
              {loadingOutboxAction ? 'Procesando...' : 'Reencolar lote'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Mensajes en dead-letter</p>
            <button
              type="button"
              className="btn"
              disabled={loadingDeadLetter}
              onClick={() => void loadDeadLetter(deadLetterPage?.page ?? 0)}
            >
              {loadingDeadLetter ? 'Actualizando...' : 'Actualizar tabla'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Asunto</th>
                  <th className="px-3 py-2">Intentos</th>
                  <th className="px-3 py-2">Último error</th>
                  <th className="px-3 py-2">Actualizado</th>
                  <th className="px-3 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {deadLetterPage?.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{item.id}</td>
                    <td className="px-3 py-2 text-slate-700">{item.toAddresses}</td>
                    <td className="px-3 py-2 text-slate-700">{item.subject}</td>
                    <td className="px-3 py-2 text-slate-700">{formatNumber(item.attemptCount)}</td>
                    <td className="px-3 py-2 text-slate-600">{item.lastError ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-600">{formatDateTime(item.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="btn"
                        disabled={loadingOutboxAction || loadingRowRequeueId === item.id}
                        onClick={() => void handleRequeueFromRow(item.id)}
                      >
                        {loadingRowRequeueId === item.id ? 'Reencolando...' : 'Reencolar'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loadingDeadLetter && (!deadLetterPage || deadLetterPage.items.length === 0) && (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={7}>
                      No hay mensajes en dead-letter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="btn"
              disabled={loadingDeadLetter || !deadLetterPage || deadLetterPage.page <= 0}
              onClick={() => void loadDeadLetter((deadLetterPage?.page ?? 0) - 1)}
            >
              Página anterior
            </button>
            <span className="text-sm text-slate-600">
              Página {deadLetterPage ? deadLetterPage.page + 1 : 0} de {deadLetterPage?.totalPages ?? 0}
            </span>
            <button
              type="button"
              className="btn"
              disabled={
                loadingDeadLetter ||
                !deadLetterPage ||
                deadLetterPage.totalPages === 0 ||
                deadLetterPage.page + 1 >= deadLetterPage.totalPages
              }
              onClick={() => void loadDeadLetter((deadLetterPage?.page ?? 0) + 1)}
            >
              Página siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Series temporales (24h)</h2>
        {!series && !loading && <p className="text-sm text-slate-500">Sin series para mostrar.</p>}
        {series && (
          <div className="grid gap-3 xl:grid-cols-2">
            {series.series.map((s) => {
              const total = s.points.reduce((acc, p) => acc + p.value, 0)
              return (
                <article key={s.metric} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.metric}</p>
                  <p className="mt-1 text-sm text-slate-700">Total ventana: {formatNumber(total)}</p>
                  <div className="mt-2 text-slate-600">
                    <MiniChart points={s.points} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
