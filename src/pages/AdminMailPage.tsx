import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ErrorBox from '../components/ErrorBox'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import {
  OpsService,
  type DeadLetterItem,
  type DeadLetterPageResponse,
  type OutboxStatsResponse
} from '../services/ops'
import { IconAlertCircle, IconClock, IconInfoCircle, IconMail, IconRefresh, IconRotateClockwise, IconTrash } from '@tabler/icons-react'

const DEAD_LETTER_PAGE_SIZE = 10
const MAIL_ADMIN_RELOAD_EVENT = 'ops:mail-admin-reload'
type MailStatusFilter = '' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'SENT' | 'DROPPED'
type MailAdminReloadDetail = {
  affectedStatuses?: string[]
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

export default function AdminMailPage() {
  const [outboxStats, setOutboxStats] = useState<OutboxStatsResponse | null>(null)
  const [outboxPage, setOutboxPage] = useState<DeadLetterPageResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<MailStatusFilter>('')
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingOutbox, setLoadingOutbox] = useState(false)
  const [loadingOutboxAction, setLoadingOutboxAction] = useState(false)
  const [loadingRowRequeueId, setLoadingRowRequeueId] = useState<string | null>(null)
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<DeadLetterItem | null>(null)
  const outboxSentinelRef = useRef<HTMLDivElement | null>(null)

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

  const loadOutbox = useCallback(async (
    page: number,
    status: MailStatusFilter,
    mode: 'replace' | 'append' = 'replace'
  ) => {
    setLoadingOutbox(true)
    setError(null)
    try {
      const next = await OpsService.outboxQueue(page, DEAD_LETTER_PAGE_SIZE, status || undefined)
      setOutboxPage((current) => {
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
      setLoadingOutbox(false)
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadOutbox(0, statusFilter)
  }, [loadOutbox, statusFilter])

  useEffect(() => {
    const reload = (event: Event) => {
      const detail = (event as CustomEvent<MailAdminReloadDetail>).detail
      const affectedStatuses = detail?.affectedStatuses ?? []
      const shouldReloadList = statusFilter === '' || affectedStatuses.includes(statusFilter)

      if (shouldReloadList) {
        void Promise.all([loadStats(), loadOutbox(0, statusFilter)])
        return
      }

      void loadStats()
    }

    window.addEventListener(MAIL_ADMIN_RELOAD_EVENT, reload as EventListener)
    return () => window.removeEventListener(MAIL_ADMIN_RELOAD_EVENT, reload as EventListener)
  }, [loadStats, loadOutbox, statusFilter])

  useEffect(() => {
    const sentinel = outboxSentinelRef.current
    if (!sentinel || !outboxPage) return
    const hasMore = outboxPage.totalPages > 0 && outboxPage.page + 1 < outboxPage.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingOutbox) {
          void loadOutbox(outboxPage.page + 1, statusFilter, 'append')
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [outboxPage, loadOutbox, loadingOutbox, statusFilter])

  const refreshAll = async () => {
    await Promise.all([loadStats(), loadOutbox(0, statusFilter)])
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
          {outboxStats && (
            <div className="notifications-page__header-stats">
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'PENDING' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'PENDING' ? '' : 'PENDING')}
              >
                <span>Pending</span>
                <strong>{formatNumber(outboxStats.pending)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'PROCESSING' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'PROCESSING' ? '' : 'PROCESSING')}
              >
                <span>Processing</span>
                <strong>{formatNumber(outboxStats.processing)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'FAILED' ? '' : 'FAILED')}
              >
                <span>Failed</span>
                <strong>{formatNumber(outboxStats.failed)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'SENT' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'SENT' ? '' : 'SENT')}
              >
                <span>Sent</span>
                <strong>{formatNumber(outboxStats.sent)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'DROPPED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'DROPPED' ? '' : 'DROPPED')}
              >
                <span>Dead letter</span>
                <strong>{formatNumber(outboxStats.dead_letter)}</strong>
              </button>
            </div>
          )}
        </div>

        <ErrorBox error={error} />
        {loadingOutbox && !outboxPage && <LoadingContent />}

        {actionMessage && <div className="ops-action-message">{actionMessage}</div>}

        {!error && !loadingOutbox && (
          <div className="mail-list-section">
            <div className="ops-table-section__header">
              <p>{mailSectionTitle(statusFilter)}</p>
            </div>

            <div className="mail-list">
              {outboxPage?.items.map((item) => (
                <MailDeadLetterCard
                  key={item.id}
                  item={item}
                  loading={loadingOutboxAction || loadingRowRequeueId === item.id}
                  onRequeue={() => handleRequeueFromRow(item.id)}
                  onOpen={() => setSelectedMessage(item)}
                />
              ))}
              {!loadingOutbox && (!outboxPage || outboxPage.items.length === 0) && (
                <EmptyContent
                  title={mailEmptyTitle(statusFilter)}
                  subtitle={mailEmptySubtitle(statusFilter)}
                  icon={<IconInfoCircle />}
                />
              )}
            </div>

            <div ref={outboxSentinelRef} className="h-6" />
          </div>
        )}
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

function mailSectionTitle(statusFilter: MailStatusFilter) {
  switch (statusFilter) {
    case 'PENDING':
      return 'Mensajes pendientes'
    case 'PROCESSING':
      return 'Mensajes en procesamiento'
    case 'FAILED':
      return 'Mensajes fallidos'
    case 'SENT':
      return 'Mensajes enviados'
    case 'DROPPED':
      return 'Mensajes en dead-letter'
    default:
      return 'Mensajes de la cola'
  }
}

function mailEmptyTitle(statusFilter: MailStatusFilter) {
  switch (statusFilter) {
    case 'PENDING':
      return 'No hay mensajes pendientes'
    case 'PROCESSING':
      return 'No hay mensajes en procesamiento'
    case 'FAILED':
      return 'No hay mensajes fallidos'
    case 'SENT':
      return 'No hay mensajes enviados'
    case 'DROPPED':
      return 'No hay mensajes en dead-letter'
    default:
      return 'No hay mensajes en la cola'
  }
}

function mailEmptySubtitle(statusFilter: MailStatusFilter) {
  switch (statusFilter) {
    case 'PENDING':
      return 'Los correos pendientes de envío aparecerán acá apenas entren a la cola.'
    case 'PROCESSING':
      return 'Cuando el worker esté procesando correos, los vas a ver listados en esta vista.'
    case 'FAILED':
      return 'Los intentos fallidos quedarán visibles acá para seguimiento operativo.'
    case 'SENT':
      return 'Los correos enviados correctamente aparecerán acá cuando existan registros en ese estado.'
    case 'DROPPED':
      return 'Los mensajes descartados y listos para recuperación se mostrarán en esta vista.'
    default:
      return 'Cuando haya actividad en la cola de mail, los mensajes aparecerán listados acá.'
  }
}

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
            <span className="mail-card__pill">{formatMailStatus(item.status)}</span>
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
      {item.status === 'DROPPED' && (
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
      )}
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
            <MailDetailItem label="Estado" value={formatMailStatus(item.status)} />
            <MailDetailItem label="Intentos" value={formatNumber(item.attemptCount)} />
            <MailDetailItem label="Próximo intento" value={formatDateTime(item.nextAttemptAt)} />
            <MailDetailItem label="Enviado" value={item.sentAt ? formatDateTime(item.sentAt) : 'Pendiente'} />
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
            {item.status === 'DROPPED' && (
              <>
                <button type="button" className="mail-detail-modal__delete" disabled={deleting || loading} onClick={onDelete}>
                  <IconTrash />
                  <span>{deleting ? 'Eliminando' : 'Eliminar de la cola'}</span>
                </button>
                <button type="button" className="mail-card__action mail-detail-modal__action" disabled={loading || deleting} onClick={onRequeue}>
                  <IconRotateClockwise />
                  <span>{loading ? 'Reencolando' : 'Reencolar mensaje'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function formatMailStatus(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'PROCESSING':
      return 'Processing'
    case 'FAILED':
      return 'Failed'
    case 'SENT':
      return 'Sent'
    case 'DROPPED':
      return 'Dead letter'
    default:
      return status
  }
}

const MailDetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="mail-detail-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)
