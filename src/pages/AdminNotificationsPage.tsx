import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconBell, IconClock, IconRefresh, IconRotateClockwise } from '@tabler/icons-react'
import ErrorBox from '../components/ErrorBox'
import { AdminService, type AdminUserSummary } from '../services/admin'
import {
  OpsService,
  type NotificationQueueItem,
  type NotificationQueuePageResponse,
  type NotificationQueueStatsResponse
} from '../services/ops'

const NOTIFICATION_QUEUE_PAGE_SIZE = 10

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

function humanizeStatus(status: string) {
  switch (status) {
    case 'PENDING':
      return 'Pendiente'
    case 'PROCESSING':
      return 'Procesando'
    case 'FAILED':
      return 'Fallida'
    case 'DELIVERED':
      return 'Entregada'
    case 'DROPPED':
      return 'Dead letter'
    default:
      return status
  }
}

export default function AdminNotificationsPage() {
  const [stats, setStats] = useState<NotificationQueueStatsResponse | null>(null)
  const [queuePage, setQueuePage] = useState<NotificationQueuePageResponse | null>(null)
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [requeueingId, setRequeueingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<NotificationQueueItem | null>(null)
  const [creatingNotification, setCreatingNotification] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    userId: '',
    type: 'INFO',
    title: '',
    body: '',
    actionUrl: '',
    metadataJson: ''
  })
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    setError(null)
    try {
      setStats(await OpsService.notificationQueueStats())
    } catch (err) {
      setError(err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadQueue = useCallback(async (page: number, mode: 'replace' | 'append' = 'replace', status = statusFilter) => {
    setLoadingQueue(true)
    setError(null)
    try {
      const next = await OpsService.notificationQueue(page, NOTIFICATION_QUEUE_PAGE_SIZE, status || undefined)
      setQueuePage((current) => {
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
      setLoadingQueue(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadStats()
    void loadQueue(0)
  }, [loadStats, loadQueue])

  useEffect(() => {
    AdminService.listUsers(0, 200)
      .then((response) => setUsers(response.items))
      .catch((err) => setError(err))
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !queuePage) return
    const hasMore = queuePage.totalPages > 0 && queuePage.page + 1 < queuePage.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingQueue) {
          void loadQueue(queuePage.page + 1, 'append')
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [queuePage, loadQueue, loadingQueue])

  const refreshAll = async () => {
    await Promise.all([loadStats(), loadQueue(0)])
  }

  const handleRequeue = async (id: string) => {
    setRequeueingId(id)
    setError(null)
    setActionMessage(null)
    try {
      await OpsService.requeueNotificationById(id)
      setActionMessage(`Notificación ${id} reencolada correctamente.`)
      await refreshAll()
    } catch (err) {
      setError(err)
    } finally {
      setRequeueingId(null)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setFormError(null)
    setError(null)
    setActionMessage(null)

    try {
      if (!form.userId) {
        throw new Error('Seleccioná un usuario.')
      }
      if (!form.title.trim()) {
        throw new Error('Ingresá un título.')
      }
      if (!form.body.trim()) {
        throw new Error('Ingresá un cuerpo para la notificación.')
      }

      let metadata: Record<string, unknown> | undefined
      if (form.metadataJson.trim()) {
        const parsed = JSON.parse(form.metadataJson)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('La metadata JSON debe ser un objeto JSON válido.')
        }
        metadata = parsed as Record<string, unknown>
      }

      const response = await AdminService.enqueueNotification({
        userId: form.userId,
        type: form.type as 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR',
        title: form.title.trim(),
        body: form.body.trim(),
        actionUrl: form.actionUrl.trim() || undefined,
        metadata
      })

      setActionMessage(`Notificación encolada correctamente. Queue ID: ${response.queueId}`)
      setForm({
        userId: '',
        type: 'INFO',
        title: '',
        body: '',
        actionUrl: '',
        metadataJson: ''
      })
      setCreatingNotification(false)
      await refreshAll()
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setError(err)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Notificaciones admin</h2>
            <p>Monitoreo y recuperación de la cola de notificaciones.</p>
          </div>
          <div className="notifications-page__header-actions">
            <button
              type="button"
              className="ops-icon-button"
              onClick={() => {
                setFormError(null)
                setCreatingNotification(true)
              }}
            >
              <IconBell />
              <span>Emitir notificación</span>
            </button>
            <button type="button" className="ops-icon-button" onClick={() => void refreshAll()} disabled={loadingStats || loadingQueue}>
              <IconRefresh className={loadingStats || loadingQueue ? 'animate-spin' : undefined} />
              <span>{loadingStats || loadingQueue ? 'Actualizando' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        <ErrorBox error={error} />

        {stats && (
          <div className="ops-stats-grid">
            <OpsStatCard label="Pending" value={formatNumber(stats.pending)} />
            <OpsStatCard label="Processing" value={formatNumber(stats.processing)} />
            <OpsStatCard label="Failed" value={formatNumber(stats.failed)} tone={stats.failed > 0 ? 'warn' : 'neutral'} />
            <OpsStatCard label="Delivered" value={formatNumber(stats.delivered)} tone="ok" />
            <OpsStatCard label="Dead letter" value={formatNumber(stats.dead_letter)} tone={stats.dead_letter > 0 ? 'warn' : 'neutral'} />
          </div>
        )}

        {actionMessage && <div className="ops-action-message">{actionMessage}</div>}

        <div className="whatsapp-history-filters">
          <div className="ops-table-section__header">
            <p>Filtro de estado</p>
          </div>
          <div className="whatsapp-history-filters__grid">
            <label className="whatsapp-history-filter">
              <span>Estado</span>
              <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DROPPED">Dead letter</option>
              </select>
            </label>
            <div className="whatsapp-history-filters__actions">
              <button type="button" className="ops-icon-button" onClick={() => void loadQueue(0)} disabled={loadingQueue}>
                <IconRefresh className={loadingQueue ? 'animate-spin' : undefined} />
                <span>{loadingQueue ? 'Aplicando' : 'Aplicar filtro'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mail-list-section">
          <div className="ops-table-section__header">
            <p>Notificaciones en cola</p>
            <button
              type="button"
              className="ops-icon-button"
              disabled={loadingQueue}
              onClick={() => void loadQueue(0)}
            >
              <IconRefresh className={loadingQueue ? 'animate-spin' : undefined} />
              <span>{loadingQueue ? 'Actualizando' : 'Actualizar'}</span>
            </button>
          </div>

          <div className="mail-list">
            {queuePage?.items.map((item) => (
              <NotificationQueueCard
                key={item.id}
                item={item}
                loading={requeueingId === item.id}
                onOpen={() => setSelectedItem(item)}
                onRequeue={() => handleRequeue(item.id)}
              />
            ))}
            {!loadingQueue && (!queuePage || queuePage.items.length === 0) && (
              <div className="mail-list__empty">
                No hay notificaciones en la cola.
              </div>
            )}
          </div>

          <div className="ops-infinite-status" ref={sentinelRef}>
            <span>
              {queuePage
                ? `${formatNumber(queuePage.items.length)} de ${formatNumber(queuePage.totalElements)} notificaciones`
                : 'Sin notificaciones cargadas'}
            </span>
            {loadingQueue && (
              <span className="ops-infinite-status__loading">
                <IconRefresh className="animate-spin" />
                Cargando más
              </span>
            )}
            {queuePage && queuePage.totalPages > 0 && queuePage.page + 1 >= queuePage.totalPages && queuePage.items.length > 0 && (
              <span>Fin del listado</span>
            )}
          </div>
        </div>
      </section>

      {selectedItem && createPortal(
        <NotificationDetailModal
          item={selectedItem}
          loading={requeueingId === selectedItem.id}
          onClose={() => setSelectedItem(null)}
          onRequeue={() => handleRequeue(selectedItem.id)}
        />,
        document.body
      )}

      {creatingNotification && createPortal(
        <CreateNotificationModal
          users={users}
          form={form}
          formError={formError}
          loading={submitting}
          onClose={() => {
            if (submitting) return
            setCreatingNotification(false)
            setFormError(null)
          }}
          onChange={(updater) => setForm((current) => ({ ...current, ...updater }))}
          onSubmit={() => void handleSubmit()}
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

function NotificationQueueCard({
  item,
  loading,
  onOpen,
  onRequeue
}: {
  item: NotificationQueueItem
  loading: boolean
  onOpen: () => void
  onRequeue: () => void
}) {
  const canRequeue = item.status === 'DROPPED'
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
        <IconBell />
      </div>
      <div className="mail-card__content">
        <div className="mail-card__main">
          <div className="mail-card__title">
            <strong>{item.title}</strong>
            <span>{item.userEmail}</span>
          </div>
          <div className="mail-card__pills">
            <span className={`ops-status-pill ops-status-pill--${item.status.toLowerCase()}`}>
              {humanizeStatus(item.status)}
            </span>
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
          <span>Mensaje</span>
          <strong>{item.body}</strong>
        </div>
      </div>
      {canRequeue && (
        <button
          type="button"
          className="mail-card__action"
          onClick={(event) => {
            event.stopPropagation()
            void onRequeue()
          }}
          disabled={loading}
        >
          <IconRotateClockwise />
          <span>{loading ? 'Reencolando' : 'Reencolar'}</span>
        </button>
      )}
    </article>
  )
}

function NotificationDetailModal({
  item,
  loading,
  onClose,
  onRequeue
}: {
  item: NotificationQueueItem
  loading: boolean
  onClose: () => void
  onRequeue: () => void
}) {
  const canRequeue = item.status === 'DROPPED'
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="notification-modal-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar detalle" onClick={onClose} />
      <div className="auth-modal__panel admin-user-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <p className="auth-modal__eyebrow">Cola de notificaciones</p>
            <h1 id="notification-modal-title" className="auth-modal__title">{item.title}</h1>
          </div>
        </div>
        <div className="admin-user-modal__body">
          <div className="mail-card__meta">
            <span>Usuario</span>
            <strong>{item.userEmail}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Estado</span>
            <strong>{humanizeStatus(item.status)}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Tipo</span>
            <strong>{item.type}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Action URL</span>
            <strong>{item.actionUrl ?? '-'}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Próximo intento</span>
            <strong>{formatDateTime(item.nextAttemptAt)}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Error</span>
            <strong>{item.lastError ?? '-'}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Cuerpo</span>
            <strong>{item.body}</strong>
          </div>
        </div>
        <div className="admin-user-modal__actions">
          {canRequeue && (
            <button type="button" className="btn btn-primary" onClick={() => void onRequeue()} disabled={loading}>
              {loading ? 'Reencolando...' : 'Reencolar'}
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateNotificationModal({
  users,
  form,
  formError,
  loading,
  onClose,
  onChange,
  onSubmit
}: {
  users: AdminUserSummary[]
  form: {
    userId: string
    type: string
    title: string
    body: string
    actionUrl: string
    metadataJson: string
  }
  formError: string | null
  loading: boolean
  onClose: () => void
  onChange: (patch: Partial<{
    userId: string
    type: string
    title: string
    body: string
    actionUrl: string
    metadataJson: string
  }>) => void
  onSubmit: () => void
}) {
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="create-notification-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel admin-user-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <p className="auth-modal__eyebrow">Cola de notificaciones</p>
            <h1 id="create-notification-title" className="auth-modal__title">Emitir notificación</h1>
          </div>
        </div>

        <div className="admin-user-modal__body">
          {formError && <div className="ops-action-message" style={{ background: '#fef2f2', color: '#b91c1c' }}>{formError}</div>}

          <div className="whatsapp-history-filters__grid">
            <label className="whatsapp-history-filter">
              <span>Usuario</span>
              <select
                className="input"
                value={form.userId}
                onChange={(event) => onChange({ userId: event.target.value })}
              >
                <option value="">Seleccionar usuario</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email}{user.name ? ` · ${user.name}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="whatsapp-history-filter">
              <span>Tipo</span>
              <select
                className="input"
                value={form.type}
                onChange={(event) => onChange({ type: event.target.value })}
              >
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            </label>
            <label className="whatsapp-history-filter">
              <span>Título</span>
              <input
                className="input"
                value={form.title}
                onChange={(event) => onChange({ title: event.target.value })}
                placeholder="Nueva notificación"
              />
            </label>
            <label className="whatsapp-history-filter">
              <span>Action URL</span>
              <input
                className="input"
                value={form.actionUrl}
                onChange={(event) => onChange({ actionUrl: event.target.value })}
                placeholder="/comprobantes"
              />
            </label>
          </div>

          <div className="whatsapp-history-filters__grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="whatsapp-history-filter">
              <span>Cuerpo</span>
              <textarea
                className="input"
                rows={4}
                value={form.body}
                onChange={(event) => onChange({ body: event.target.value })}
                placeholder="Detalle de la notificación"
              />
            </label>
            <label className="whatsapp-history-filter">
              <span>Metadata JSON</span>
              <textarea
                className="input"
                rows={4}
                value={form.metadataJson}
                onChange={(event) => onChange({ metadataJson: event.target.value })}
                placeholder='{"source":"admin"}'
              />
            </label>
          </div>
        </div>

        <div className="admin-user-modal__actions">
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={loading}>
            {loading ? 'Encolando...' : 'Emitir notificación'}
          </button>
          <button type="button" className="btn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
