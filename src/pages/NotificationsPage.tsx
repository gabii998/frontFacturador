import { useCallback, useEffect, useRef, useState } from 'react'
import { IconAlertCircle, IconAlertTriangle, IconBell, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import ErrorBox from '../components/ErrorBox'
import {
  NotificationService,
  type NotificationItem,
  type NotificationPageResponse,
  type NotificationStatsResponse
} from '../services/notifications'

const PAGE_SIZE = 12

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

function toneClass(type: NotificationItem['type']) {
  switch (type) {
    case 'SUCCESS':
      return 'notifications-page__item--success'
    case 'WARNING':
      return 'notifications-page__item--warning'
    case 'ERROR':
      return 'notifications-page__item--error'
    default:
      return 'notifications-page__item--info'
  }
}

function iconToneClass(type: NotificationItem['type']) {
  switch (type) {
    case 'SUCCESS':
      return 'notifications-page__item-icon--success'
    case 'WARNING':
      return 'notifications-page__item-icon--warning'
    case 'ERROR':
      return 'notifications-page__item-icon--error'
    default:
      return 'notifications-page__item-icon--info'
  }
}

function NotificationTypeIcon({ type }: { type: NotificationItem['type'] }) {
  switch (type) {
    case 'SUCCESS':
      return <IconCircleCheck />
    case 'WARNING':
      return <IconAlertTriangle />
    case 'ERROR':
      return <IconAlertCircle />
    default:
      return <IconInfoCircle />
  }
}

export default function NotificationsPage() {
  const [viewMode, setViewMode] = useState<'unread' | 'read' | 'total'>('total')
  const [stats, setStats] = useState<NotificationStatsResponse | null>(null)
  const [pageData, setPageData] = useState<NotificationPageResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const displayItems = pageData?.items ?? []

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      setStats(await NotificationService.stats())
    } catch (err) {
      setError(err)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadPage = useCallback(async (page: number, mode: 'replace' | 'append' = 'replace', estado = viewMode) => {
    setLoading(true)
    try {
      const next = await NotificationService.list(page, PAGE_SIZE, estado)
      setPageData((current) => {
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
      setLoading(false)
    }
  }, [viewMode])

  useEffect(() => {
    void Promise.all([loadStats(), loadPage(0, 'replace', viewMode)])
  }, [loadPage, loadStats, viewMode])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !pageData) return
    const hasMore = pageData.totalPages > 0 && pageData.page + 1 < pageData.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loading) {
          void loadPage(pageData.page + 1, 'append', viewMode)
        }
      },
      { rootMargin: '220px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadPage, loading, pageData, viewMode])

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.readAt) return
    setMarkingId(item.id)
    setError(null)
    try {
      await NotificationService.markAsRead(item.id)
      await Promise.all([loadStats(), loadPage(0, 'replace', viewMode)])
    } catch (err) {
      setError(err)
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="ops-page notifications-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Notificaciones</h2>
            <p>Historial de avisos del sistema, acciones pendientes y confirmaciones recientes.</p>
          </div>
          <div className="notifications-page__header-actions">
            <div className="notifications-page__header-stats">
              <button
                type="button"
                className={`notifications-page__header-pill ${viewMode === 'unread' ? 'is-active' : ''}`}
                onClick={() => setViewMode('unread')}
              >
                <span>Sin leer</span>
                <strong>{stats?.unread ?? 0}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${viewMode === 'read' ? 'is-active' : ''}`}
                onClick={() => setViewMode('read')}
              >
                <span>Leídas</span>
                <strong>{stats?.read ?? 0}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${viewMode === 'total' ? 'is-active' : ''}`}
                onClick={() => setViewMode('total')}
              >
                <span>Total</span>
                <strong>{stats?.total ?? 0}</strong>
              </button>
            </div>
          </div>
        </div>

        <ErrorBox error={error} />

        <div className="notifications-page__toolbar">
          <div className="notifications-page__toolbar-copy">
            <IconBell />
            <span>{stats?.unread ?? 0} notificaciones sin leer</span>
          </div>
        </div>

        <div className="notifications-page__list">
          {displayItems.length ? (
            displayItems.map((item) => (
              <article key={item.id} className={`notifications-page__item ${toneClass(item.type)} ${item.readAt ? '' : 'is-unread'}`}>
                <div className="notifications-page__item-layout">
                  <div className="notifications-page__item-icon-col">
                    <span className={`notifications-page__item-icon ${iconToneClass(item.type)}`}>
                      <NotificationTypeIcon type={item.type} />
                    </span>
                  </div>
                  <div className="notifications-page__item-content">
                    <div className="notifications-page__item-head">
                      <div>
                        <div className="notifications-page__item-meta">
                          {!item.readAt && <span className="notifications-page__unread-dot">Nueva</span>}
                        </div>
                        <h3>{item.title}</h3>
                      </div>
                      <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                    </div>
                    <p>{item.body}</p>
                    {(item.actionUrl || !item.readAt) && (
                      <div className="notifications-page__item-actions">
                        {item.actionUrl && (
                          <a className="btn" href={item.actionUrl}>
                            Ir a la sección
                          </a>
                        )}
                        {!item.readAt && (
                          <button type="button" className="btn-primary" onClick={() => void handleMarkAsRead(item)} disabled={markingId === item.id}>
                            {markingId === item.id ? 'Marcando...' : 'Marcar como leída'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : !error ? (
            <EmptyContent
              title={
                loading
                  ? 'Cargando notificaciones...'
                  : viewMode === 'unread'
                    ? 'No hay notificaciones sin leer'
                    : viewMode === 'read'
                      ? 'No hay notificaciones leídas para mostrar'
                      : 'No hay notificaciones para mostrar'
              }
              subtitle={
                loading
                  ? 'Estamos consultando tu historial de avisos del sistema.'
                  : viewMode === 'unread'
                    ? 'Cuando llegue una nueva notificación pendiente, la vas a ver en esta vista.'
                    : viewMode === 'read'
                      ? 'Todavía no registrás notificaciones marcadas como leídas.'
                      : 'Cuando el sistema genere avisos para tu cuenta, aparecerán listados acá.'
              }
              icon={<IconInfoCircle />}
            />
          ) : null}
        </div>

        <div ref={sentinelRef} className="h-6" />
      </section>
    </div>
  )
}
