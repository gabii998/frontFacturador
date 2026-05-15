import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import ErrorBox from '../components/ErrorBox'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import {
  OpsService,
  type DashboardSnapshot,
  type MetricPoint,
  type TimeseriesSnapshot
} from '../services/ops'
import {
  IconBrandWhatsapp,
  IconChartLine,
  IconClock,
  IconRefresh,
  IconServer,
  IconWebhook
} from '@tabler/icons-react'

const DEFAULT_METRICS = [
  'payment.webhook.failed.count',
  'payment.webhook.processed.count',
  'whatsapp.webhook.events.count'
]

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
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" />
    </svg>
  )
}

export default function AdminOpsPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [series, setSeries] = useState<TimeseriesSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const to = new Date().toISOString()
      const from = toIsoHoursAgo(24)
      const [nextSnapshot, nextSeries] = await Promise.all([
        OpsService.dashboard(),
        OpsService.timeseries({
          metrics: DEFAULT_METRICS,
          from,
          to,
          stepMinutes: 60
        })
      ])
      setSnapshot(nextSnapshot)
      setSeries(nextSeries)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const uptimeLabel = useMemo(() => {
    if (!snapshot) return '-'
    const total = Math.max(0, Math.floor(snapshot.uptimeSeconds))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    return `${hours}h ${minutes}m`
  }, [snapshot])

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Estado operativo</h2>
            <p>{snapshot ? `Actualizado: ${formatDateTime(snapshot.generatedAt)}` : 'Cargando snapshot...'}</p>
          </div>
          <button type="button" className="ops-icon-button" onClick={() => void load()} disabled={loading} aria-label="Actualizar estado operativo">
            <IconRefresh className={loading ? 'animate-spin' : undefined} />
            <span>{loading ? 'Actualizando' : 'Actualizar'}</span>
          </button>
        </div>

        <ErrorBox error={error} />
        {loading && !snapshot && <LoadingContent />}

        {snapshot && (
          <div className="ops-metrics-grid">
            <OpsMetricCard icon={<IconServer />} label="Uptime" value={uptimeLabel} />
            <OpsMetricCard icon={<IconWebhook />} label="Pagos fallidos" value={formatNumber(snapshot.webhooks.payment.failed)} tone={snapshot.webhooks.payment.failed > 0 ? 'warn' : 'neutral'} />
            <OpsMetricCard icon={<IconBrandWhatsapp />} label="WhatsApp 24h" value={formatNumber(snapshot.webhooks.whatsapp.events24h)} />
            <OpsMetricCard icon={<IconClock />} label="MP latencia p95" value={`${Math.round(snapshot.integrations.mercadopago.p95LatencyMs)} ms`} />
          </div>
        )}
      </section>

      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Series temporales</h2>
            <p>Ventana de las últimas 24 horas.</p>
          </div>
        </div>
        {!series && !loading && !error && (
          <EmptyContent
            title="No hay series para mostrar"
            subtitle="Cuando existan métricas temporales disponibles, las vas a ver resumidas en esta vista."
            icon={<IconChartLine />}
          />
        )}
        {series && (
          <div className="ops-series-grid">
            {series.series.map((s) => {
              const total = s.points.reduce((acc, p) => acc + p.value, 0)
              return (
                <article key={s.metric} className="ops-series-card">
                  <div className="ops-series-card__header">
                    <IconChartLine />
                    <div>
                      <p>{s.label}</p>
                      <span>{s.metric}</span>
                    </div>
                    <strong>{formatNumber(total)}</strong>
                  </div>
                  <div className="ops-series-card__chart">
                    <MiniChart points={s.points} />
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

const OpsMetricCard = ({
  icon,
  label,
  value,
  tone = 'neutral'
}: {
  icon: ReactNode
  label: string
  value: string
  tone?: 'neutral' | 'warn'
}) => (
  <div className={`ops-metric-card ops-metric-card--${tone}`}>
    <div className="ops-metric-card__icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
)
