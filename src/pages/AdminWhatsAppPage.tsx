import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconAlertCircle, IconBrandWhatsapp, IconFilter, IconInfoCircle, IconMessageCircle, IconRefresh, IconSend, IconX } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import ErrorBox from '../components/ErrorBox'
import LoadingContent from '../components/LoadingContent'
import {
  OpsService,
  type WhatsAppHistoryItem,
  type WhatsAppHistoryPageResponse
} from '../services/ops'

const WHATSAPP_HISTORY_PAGE_SIZE = 20

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

function humanizeDirection(value: string) {
  switch (value) {
    case 'INBOUND':
      return 'Entrante'
    case 'OUTBOUND':
      return 'Saliente'
    default:
      return value
  }
}

function humanizeStatus(value: string) {
  switch (value) {
    case 'RECEIVED':
      return 'Recibido'
    case 'SENT':
      return 'Enviado'
    case 'FAILED':
      return 'Fallido'
    default:
      return value
  }
}

function normalizeDateInput(value: string) {
  return value.trim()
}

export default function AdminWhatsAppPage() {
  const [historyPage, setHistoryPage] = useState<WhatsAppHistoryPageResponse | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [selectedItem, setSelectedItem] = useState<WhatsAppHistoryItem | null>(null)
  const [filters, setFilters] = useState({
    phone: '',
    direction: '',
    status: '',
    from: '',
    to: ''
  })
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadHistory = useCallback(async (page: number, mode: 'replace' | 'append' = 'replace', currentFilters = appliedFilters) => {
    setLoadingHistory(true)
    setError(null)
    try {
      const next = await OpsService.whatsappHistory({
        page,
        size: WHATSAPP_HISTORY_PAGE_SIZE,
        phone: currentFilters.phone || undefined,
        direction: currentFilters.direction || undefined,
        status: currentFilters.status || undefined,
        from: currentFilters.from || undefined,
        to: currentFilters.to || undefined
      })
      setHistoryPage((current) => {
        if (mode === 'append' && current) {
          const existingIds = new Set(current.items.map((item) => item.id))
          const appendedItems = next.items.filter((item) => !existingIds.has(item.id))
          return { ...next, items: [...current.items, ...appendedItems] }
        }
        return next
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoadingHistory(false)
    }
  }, [appliedFilters])

  useEffect(() => {
    void loadHistory(0, 'replace', appliedFilters)
  }, [appliedFilters, loadHistory])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !historyPage) return
    const hasMore = historyPage.totalPages > 0 && historyPage.page + 1 < historyPage.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingHistory) {
          void loadHistory(historyPage.page + 1, 'append')
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [historyPage, loadHistory, loadingHistory])

  const stats = useMemo(() => {
    const items = historyPage?.items ?? []
    return {
      total: historyPage?.totalElements ?? 0,
      inbound: items.filter((item) => item.direction === 'INBOUND').length,
      outbound: items.filter((item) => item.direction === 'OUTBOUND').length,
      failed: items.filter((item) => item.status === 'FAILED').length
    }
  }, [historyPage])

  const applyFilters = () => {
    setSelectedItem(null)
    setAppliedFilters({
      phone: filters.phone.trim(),
      direction: filters.direction,
      status: filters.status,
      from: normalizeDateInput(filters.from),
      to: normalizeDateInput(filters.to)
    })
  }

  const clearFilters = () => {
    const next = { phone: '', direction: '', status: '', from: '', to: '' }
    setFilters(next)
    setAppliedFilters(next)
    setSelectedItem(null)
  }

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>WhatsApp admin</h2>
            <p>Auditoría de mensajes entrantes y respuestas enviadas desde la operación.</p>
          </div>
          <button
            type="button"
            className="ops-icon-button"
            disabled={loadingHistory}
            onClick={() => void loadHistory(0, 'replace')}
          >
            <IconRefresh className={loadingHistory ? 'animate-spin' : undefined} />
            <span>{loadingHistory ? 'Actualizando' : 'Actualizar'}</span>
          </button>
        </div>

        <ErrorBox error={error} />
        {loadingHistory && !historyPage && <LoadingContent />}

        <div className="ops-stats-grid">
          <OpsStatCard label="Resultados" value={formatNumber(stats.total)} />
          <OpsStatCard label="Entrantes" value={formatNumber(stats.inbound)} />
          <OpsStatCard label="Salientes" value={formatNumber(stats.outbound)} />
          <OpsStatCard label="Fallidos" value={formatNumber(stats.failed)} tone={stats.failed > 0 ? 'warn' : 'neutral'} />
        </div>

        <div className="whatsapp-history-filters">
          <div className="ops-table-section__header">
            <p>Filtros de auditoría</p>
            <div className="whatsapp-history-filters__actions">
              <button type="button" className="ops-icon-button" onClick={applyFilters} disabled={loadingHistory}>
                <IconFilter />
                <span>Aplicar</span>
              </button>
              <button type="button" className="ops-icon-button" onClick={clearFilters} disabled={loadingHistory}>
                <IconX />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          <div className="whatsapp-history-filters__grid">
            <label className="whatsapp-history-filter">
              <span>Teléfono</span>
              <input
                className="input"
                value={filters.phone}
                onChange={(event) => setFilters((current) => ({ ...current, phone: event.target.value }))}
                placeholder="5492615551234"
              />
            </label>
            <label className="whatsapp-history-filter">
              <span>Dirección</span>
              <select
                className="input"
                value={filters.direction}
                onChange={(event) => setFilters((current) => ({ ...current, direction: event.target.value }))}
              >
                <option value="">Todas</option>
                <option value="INBOUND">Entrante</option>
                <option value="OUTBOUND">Saliente</option>
              </select>
            </label>
            <label className="whatsapp-history-filter">
              <span>Estado</span>
              <select
                className="input"
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="">Todos</option>
                <option value="RECEIVED">Recibido</option>
                <option value="SENT">Enviado</option>
                <option value="FAILED">Fallido</option>
              </select>
            </label>
            <label className="whatsapp-history-filter">
              <span>Desde</span>
              <input
                className="input"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                placeholder="2026-05-14T00:00:00Z"
              />
            </label>
            <label className="whatsapp-history-filter">
              <span>Hasta</span>
              <input
                className="input"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                placeholder="2026-05-14T23:59:59Z"
              />
            </label>
          </div>
        </div>

        {!error && !loadingHistory && (
          <div className="mail-list-section">
            <div className="ops-table-section__header">
              <p>Mensajes auditados</p>
              <span className="whatsapp-history-caption">
                Click para ver payload completo y metadatos.
              </span>
            </div>

            <div className="mail-list">
              {historyPage?.items.map((item) => (
                <WhatsAppHistoryCard
                  key={item.id}
                  item={item}
                  onOpen={() => setSelectedItem(item)}
                />
              ))}
              {!loadingHistory && (!historyPage || historyPage.items.length === 0) && (
                <EmptyContent
                  title="No hay mensajes de WhatsApp para los filtros seleccionados"
                  subtitle="Ajustá los filtros de auditoría o esperá nueva actividad para ver mensajes en esta vista."
                  icon={<IconInfoCircle />}
                />
              )}
            </div>

            <div ref={sentinelRef} className="h-6" />
          </div>
        )}
      </section>

      {selectedItem && createPortal(
        <WhatsAppHistoryDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />,
        document.body
      )}
    </div>
  )
}

const OpsStatCard = ({
  label,
  value,
  tone = 'neutral'
}: {
  label: string
  value: string
  tone?: 'neutral' | 'warn' | 'ok'
}) => (
  <div className={`ops-stat-card ops-stat-card--${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

function WhatsAppHistoryCard({
  item,
  onOpen
}: {
  item: WhatsAppHistoryItem
  onOpen: () => void
}) {
  const isInbound = item.direction === 'INBOUND'
  return (
    <article
      className="mail-card whatsapp-history-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="mail-card__icon whatsapp-history-card__icon">
        {isInbound ? <IconMessageCircle /> : <IconSend />}
      </div>
      <div className="mail-card__content">
        <div className="mail-card__main">
          <div className="mail-card__title">
            <strong>{item.phone}</strong>
            <span>{item.messageId ?? 'Sin messageId'}</span>
          </div>
          <div className="mail-card__pills">
            <span className={`ops-status-pill ops-status-pill--${item.direction.toLowerCase()}`}>
              {humanizeDirection(item.direction)}
            </span>
            <span className={`ops-status-pill ops-status-pill--${item.status.toLowerCase()}`}>
              {humanizeStatus(item.status)}
            </span>
            {item.messageType && <span className="mail-card__pill">{item.messageType}</span>}
            <span className="mail-card__pill">
              <IconBrandWhatsapp />
              {formatDateTime(item.createdAt)}
            </span>
          </div>
        </div>

        <div className="whatsapp-history-card__preview">
          <div className="mail-card__meta">
            <span>Vista previa</span>
            <strong>{item.textPreview?.trim() || 'Sin texto legible'}</strong>
          </div>
        </div>
      </div>
    </article>
  )
}

function WhatsAppHistoryDetailModal({
  item,
  onClose
}: {
  item: WhatsAppHistoryItem
  onClose: () => void
}) {
  const prettyPayload = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(item.payloadJson), null, 2)
    } catch {
      return item.payloadJson
    }
  }, [item.payloadJson])

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="whatsapp-history-modal-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar detalle" onClick={onClose} />
      <div className="auth-modal__panel whatsapp-history-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <p className="auth-modal__eyebrow">WhatsApp admin</p>
            <h1 id="whatsapp-history-modal-title" className="auth-modal__title">Detalle del mensaje</h1>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar detalle" onClick={onClose}>
            <IconX />
          </button>
        </div>

        <div className="whatsapp-history-modal__body">
          <div className="whatsapp-history-modal__meta">
            <MetaItem label="Teléfono" value={item.phone} />
            <MetaItem label="Dirección" value={humanizeDirection(item.direction)} />
            <MetaItem label="Estado" value={humanizeStatus(item.status)} />
            <MetaItem label="Tipo" value={item.messageType || '-'} />
            <MetaItem label="Message ID" value={item.messageId || '-'} />
            <MetaItem label="Fecha" value={formatDateTime(item.createdAt)} />
          </div>

          <section className="whatsapp-history-modal__section">
            <h3>Vista previa</h3>
            <p>{item.textPreview?.trim() || 'Sin texto legible'}</p>
          </section>

          <section className="whatsapp-history-modal__section">
            <h3>Payload JSON</h3>
            <pre className="whatsapp-history-modal__payload">{prettyPayload}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="mail-card__meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
