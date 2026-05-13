import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ErrorBox from '../components/ErrorBox'
import {
  OpsService,
  type DeadLetterItem,
  type DeadLetterPageResponse,
  type OutboxStatsResponse
} from '../services/ops'
import { IconAlertCircle, IconClock, IconMail, IconRefresh, IconRotateClockwise, IconTrash } from '@tabler/icons-react'

const DEAD_LETTER_PAGE_SIZE = 10

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

export default function AdminMailPage() {
  const [outboxStats, setOutboxStats] = useState<OutboxStatsResponse | null>(null)
  const [deadLetterPage, setDeadLetterPage] = useState<DeadLetterPageResponse | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingDeadLetter, setLoadingDeadLetter] = useState(false)
  const [loadingOutboxAction, setLoadingOutboxAction] = useState(false)
  const [loadingRowRequeueId, setLoadingRowRequeueId] = useState<string | null>(null)
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<DeadLetterItem | null>(null)
  const deadLetterSentinelRef = useRef<HTMLDivElement | null>(null)

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    setError(null)
    try {
      setOutboxStats(await OpsService.outboxStats())
    } catch (err) {
      setError(err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadDeadLetter = useCallback(async (page: number, mode: 'replace' | 'append' = 'replace') => {
    setLoadingDeadLetter(true)
    setError(null)
    try {
      const next = await OpsService.deadLetter(page, DEAD_LETTER_PAGE_SIZE)
      setDeadLetterPage((current) => {
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
      setLoadingDeadLetter(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
    void loadDeadLetter(0)
  }, [loadStats, loadDeadLetter])

  useEffect(() => {
    const sentinel = deadLetterSentinelRef.current
    if (!sentinel || !deadLetterPage) return
    const hasMore = deadLetterPage.totalPages > 0 && deadLetterPage.page + 1 < deadLetterPage.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingDeadLetter) {
          void loadDeadLetter(deadLetterPage.page + 1, 'append')
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [deadLetterPage, loadDeadLetter, loadingDeadLetter])

  const refreshAll = async () => {
    await Promise.all([loadStats(), loadDeadLetter(0)])
  }

  const handleRequeueFromRow = async (id: string) => {
    setLoadingRowRequeueId(id)
    setError(null)
    setActionMessage(null)
    try {
      await OpsService.requeueOutboxById(id)
      setActionMessage(`Mensaje ${id} reencolado correctamente.`)
      await refreshAll()
    } catch (err) {
      setError(err)
    } finally {
      setLoadingRowRequeueId(null)
    }
  }

  const handleDeleteFromQueue = async (id: string) => {
    setDeletingRowId(id)
    setError(null)
    setActionMessage(null)
    try {
      await OpsService.deleteOutboxById(id)
      setSelectedMessage(null)
      setActionMessage(`Mensaje ${id} eliminado de la cola.`)
      await refreshAll()
    } catch (err) {
      setError(err)
    } finally {
      setDeletingRowId(null)
    }
  }

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Mail admin</h2>
            <p>Monitoreo y recuperación de la cola de emails.</p>
          </div>
          <button type="button" className="ops-icon-button" onClick={() => void refreshAll()} disabled={loadingStats || loadingDeadLetter}>
            <IconRefresh className={loadingStats || loadingDeadLetter ? 'animate-spin' : undefined} />
            <span>{loadingStats || loadingDeadLetter ? 'Actualizando' : 'Actualizar'}</span>
          </button>
        </div>

        <ErrorBox error={error} />

        {outboxStats && (
          <div className="ops-stats-grid">
            <OpsStatCard label="Pending" value={formatNumber(outboxStats.pending)} />
            <OpsStatCard label="Processing" value={formatNumber(outboxStats.processing)} />
            <OpsStatCard label="Failed" value={formatNumber(outboxStats.failed)} tone={outboxStats.failed > 0 ? 'warn' : 'neutral'} />
            <OpsStatCard label="Sent" value={formatNumber(outboxStats.sent)} tone="ok" />
            <OpsStatCard label="Dead letter" value={formatNumber(outboxStats.dead_letter)} tone={outboxStats.dead_letter > 0 ? 'warn' : 'neutral'} />
          </div>
        )}

        {actionMessage && <div className="ops-action-message">{actionMessage}</div>}

        <div className="mail-list-section">
          <div className="ops-table-section__header">
            <p>Mensajes en dead-letter</p>
            <button
              type="button"
              className="ops-icon-button"
              disabled={loadingDeadLetter}
              onClick={() => void loadDeadLetter(0)}
            >
              <IconRefresh className={loadingDeadLetter ? 'animate-spin' : undefined} />
              <span>{loadingDeadLetter ? 'Actualizando' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="mail-list">
            {deadLetterPage?.items.map((item) => (
              <MailDeadLetterCard
                key={item.id}
                item={item}
                loading={loadingOutboxAction || loadingRowRequeueId === item.id}
                onRequeue={() => handleRequeueFromRow(item.id)}
                onOpen={() => setSelectedMessage(item)}
              />
            ))}
            {!loadingDeadLetter && (!deadLetterPage || deadLetterPage.items.length === 0) && (
              <div className="mail-list__empty">
                No hay mensajes en dead-letter.
              </div>
            )}
          </div>

          <div className="ops-infinite-status" ref={deadLetterSentinelRef}>
            <span>
              {deadLetterPage
                ? `${formatNumber(deadLetterPage.items.length)} de ${formatNumber(deadLetterPage.totalElements)} mensajes`
                : 'Sin mensajes cargados'}
            </span>
            {loadingDeadLetter && (
              <span className="ops-infinite-status__loading">
                <IconRefresh className="animate-spin" />
                Cargando más
              </span>
            )}
            {deadLetterPage && deadLetterPage.totalPages > 0 && deadLetterPage.page + 1 >= deadLetterPage.totalPages && deadLetterPage.items.length > 0 && (
              <span>Fin del listado</span>
            )}
          </div>
        </div>
      </section>

      {selectedMessage && createPortal(
        <MailDetailModal
          item={selectedMessage}
          loading={loadingOutboxAction || loadingRowRequeueId === selectedMessage.id}
          deleting={deletingRowId === selectedMessage.id}
          onClose={() => setSelectedMessage(null)}
          onRequeue={() => handleRequeueFromRow(selectedMessage.id)}
          onDelete={() => handleDeleteFromQueue(selectedMessage.id)}
        />,
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

const MailDeadLetterCard = ({
  item,
  loading,
  onRequeue,
  onOpen
}: {
  item: DeadLetterItem
  loading: boolean
  onRequeue: () => void
  onOpen: () => void
}) => {
  return (
    <article
      className="mail-card"
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
      <div className="mail-card__icon">
        <IconMail />
      </div>
      <div className="mail-card__content">
        <div className="mail-card__main">
          <div className="mail-card__title">
            <strong>{item.subject || 'Sin asunto'}</strong>
            <span title={item.id}>{item.id}</span>
          </div>
          <div className="mail-card__pills">
            <span className="mail-card__pill mail-card__pill--attempts">
              {formatNumber(item.attemptCount)} intentos
            </span>
            <span className="mail-card__pill">
              <IconClock />
              {formatDateTime(item.updatedAt)}
            </span>
          </div>
        </div>

        <div className="mail-card__meta">
          <span>Destino</span>
          <strong>{item.toAddresses}</strong>
        </div>

      </div>
      <button
        type="button"
        className="mail-card__action"
        disabled={loading}
        onClick={(event) => {
          event.stopPropagation()
          onRequeue()
        }}
      >
        <IconRotateClockwise />
        <span>{loading ? 'Reencolando' : 'Reencolar'}</span>
      </button>
    </article>
  )
}

const MailDetailModal = ({
  item,
  loading,
  deleting,
  onClose,
  onRequeue,
  onDelete
}: {
  item: DeadLetterItem
  loading: boolean
  deleting: boolean
  onClose: () => void
  onRequeue: () => void
  onDelete: () => void
}) => {
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="mail-detail-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel mail-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="mail-detail-title" className="auth-modal__title">Detalle del mensaje</h1>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.id}</p>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar modal" onClick={onClose}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="mail-detail-modal__body">
          <div className="mail-detail-grid">
            <MailDetailItem label="Asunto" value={item.subject || 'Sin asunto'} />
            <MailDetailItem label="Destino" value={item.toAddresses} />
            <MailDetailItem label="Intentos" value={formatNumber(item.attemptCount)} />
            <MailDetailItem label="Próximo intento" value={formatDateTime(item.nextAttemptAt)} />
            <MailDetailItem label="Creado" value={formatDateTime(item.createdAt)} />
            <MailDetailItem label="Actualizado" value={formatDateTime(item.updatedAt)} />
          </div>

          <div className="mail-detail-error">
            <div>
              <IconAlertCircle />
              <strong>Último error</strong>
            </div>
            <p>{item.lastError ?? 'Sin error registrado.'}</p>
          </div>

          <div className="mail-detail-modal__actions">
            <button type="button" className="mail-detail-modal__delete" disabled={deleting || loading} onClick={onDelete}>
              <IconTrash />
              <span>{deleting ? 'Eliminando' : 'Eliminar de la cola'}</span>
            </button>
            <button type="button" className="mail-card__action mail-detail-modal__action" disabled={loading || deleting} onClick={onRequeue}>
              <IconRotateClockwise />
              <span>{loading ? 'Reencolando' : 'Reencolar mensaje'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MailDetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="mail-detail-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)
