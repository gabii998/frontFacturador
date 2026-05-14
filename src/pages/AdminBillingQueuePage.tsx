import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  OpsService,
  type InvoiceQueueItem,
  type InvoiceQueuePageResponse
} from '../services/ops'
import ErrorBox from '../components/ErrorBox'
import { IconAlertCircle, IconBuildingBank, IconClock, IconFileInvoice } from '@tabler/icons-react'

const INVOICE_QUEUE_PAGE_SIZE = 10
type InvoiceQueueFilter = '' | 'QUEUED' | 'PROCESSING' | 'EMITTED' | 'FAILED' | 'CANCELLED'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

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

function formatAmount(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return currencyFormatter.format(value)
}

function humanizeInvoiceQueueStatus(status: string) {
  switch (status) {
    case 'QUEUED':
      return 'En cola'
    case 'PROCESSING':
      return 'Procesando'
    case 'EMITTED':
      return 'Emitida'
    case 'FAILED':
      return 'Fallida'
    case 'CANCELLED':
      return 'Sin reintentos'
    default:
      return status
  }
}

function humanizeResultado(resultado?: string | null) {
  switch (resultado) {
    case 'A':
      return 'Aprobado'
    case 'R':
      return 'Rechazado'
    case 'P':
      return 'Parcial'
    case null:
    case undefined:
    case '':
      return 'Sin respuesta'
    default:
      return resultado
  }
}

export default function AdminBillingQueuePage() {
  const [invoiceQueuePage, setInvoiceQueuePage] = useState<InvoiceQueuePageResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<InvoiceQueueFilter>('')
  const [loadingInvoiceQueue, setLoadingInvoiceQueue] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [selectedRequest, setSelectedRequest] = useState<InvoiceQueueItem | null>(null)
  const invoiceQueueSentinelRef = useRef<HTMLDivElement | null>(null)

  const loadInvoiceQueue = useCallback(async (
    page: number,
    mode: 'replace' | 'append' = 'replace',
    status: InvoiceQueueFilter = statusFilter
  ) => {
    setLoadingInvoiceQueue(true)
    setError(null)
    try {
      const next = await OpsService.invoiceQueue(page, INVOICE_QUEUE_PAGE_SIZE, status || undefined)
      setInvoiceQueuePage((current) => {
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
      setLoadingInvoiceQueue(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadInvoiceQueue(0)
  }, [loadInvoiceQueue])

  useEffect(() => {
    void loadInvoiceQueue(0, 'replace', statusFilter)
  }, [loadInvoiceQueue, statusFilter])

  useEffect(() => {
    const sentinel = invoiceQueueSentinelRef.current
    if (!sentinel || !invoiceQueuePage) return
    const hasMore = invoiceQueuePage.totalPages > 0 && invoiceQueuePage.page + 1 < invoiceQueuePage.totalPages
    if (!hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !loadingInvoiceQueue) {
          void loadInvoiceQueue(invoiceQueuePage.page + 1, 'append', statusFilter)
        }
      },
      { rootMargin: '180px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [invoiceQueuePage, loadInvoiceQueue, loadingInvoiceQueue, statusFilter])

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Cola de facturación</h2>
            <p>Solicitudes de emisión, intentos y estado operativo de ARCA.</p>
          </div>
          {invoiceQueuePage && (
            <div className="notifications-page__header-stats">
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'QUEUED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'QUEUED' ? '' : 'QUEUED')}
              >
                <span>En cola</span>
                <strong>{formatNumber(invoiceQueuePage.stats.queued)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'PROCESSING' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'PROCESSING' ? '' : 'PROCESSING')}
              >
                <span>Procesando</span>
                <strong>{formatNumber(invoiceQueuePage.stats.processing)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'EMITTED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'EMITTED' ? '' : 'EMITTED')}
              >
                <span>Emitidas</span>
                <strong>{formatNumber(invoiceQueuePage.stats.emitted)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'FAILED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'FAILED' ? '' : 'FAILED')}
              >
                <span>Fallidas</span>
                <strong>{formatNumber(invoiceQueuePage.stats.failed)}</strong>
              </button>
              <button
                type="button"
                className={`notifications-page__header-pill ${statusFilter === 'CANCELLED' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter((current) => current === 'CANCELLED' ? '' : 'CANCELLED')}
              >
                <span>Sin reintentos</span>
                <strong>{formatNumber(invoiceQueuePage.stats.cancelled)}</strong>
              </button>
            </div>
          )}
        </div>

        <ErrorBox error={error} />

        {!error && (
          <div className="mail-list-section">
            <div className="ops-table-section__header">
              <p>{billingQueueTitle(statusFilter)}</p>
            </div>

            <div className="mail-list">
              {invoiceQueuePage?.items.map((item) => (
                <BillingQueueCard
                  key={item.id}
                  item={item}
                  onOpen={() => setSelectedRequest(item)}
                />
              ))}
              {!loadingInvoiceQueue && (!invoiceQueuePage || invoiceQueuePage.items.length === 0) && (
                <div className="mail-list__empty">
                  {billingQueueEmpty(statusFilter)}
                </div>
              )}
            </div>

            <div ref={invoiceQueueSentinelRef} className="h-6" />
          </div>
        )}
      </section>

      {selectedRequest && createPortal(
        <BillingQueueDetailModal
          item={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />,
        document.body
      )}
    </div>
  )
}

function billingQueueTitle(status: InvoiceQueueFilter) {
  switch (status) {
    case 'QUEUED':
      return 'Solicitudes en cola'
    case 'PROCESSING':
      return 'Solicitudes en procesamiento'
    case 'EMITTED':
      return 'Solicitudes emitidas'
    case 'FAILED':
      return 'Solicitudes fallidas'
    case 'CANCELLED':
      return 'Solicitudes sin reintentos'
    default:
      return 'Solicitudes de emisión'
  }
}

function billingQueueEmpty(status: InvoiceQueueFilter) {
  switch (status) {
    case 'QUEUED':
      return 'No hay solicitudes en cola.'
    case 'PROCESSING':
      return 'No hay solicitudes en procesamiento.'
    case 'EMITTED':
      return 'No hay solicitudes emitidas.'
    case 'FAILED':
      return 'No hay solicitudes fallidas.'
    case 'CANCELLED':
      return 'No hay solicitudes sin reintentos.'
    default:
      return 'No hay solicitudes en la cola de facturación.'
  }
}

const BillingQueueCard = ({
  item,
  onOpen
}: {
  item: InvoiceQueueItem
  onOpen: () => void
}) => {
  return (
    <article
      className="mail-card billing-queue-card"
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
      <div className="mail-card__icon billing-queue-card__icon">
        <IconFileInvoice />
      </div>
      <div className="mail-card__content">
        <div className="mail-card__main">
          <div className="mail-card__title">
            <strong>Solicitud #{item.id}</strong>
            <span title={item.externalId}>{item.externalId}</span>
          </div>
          <div className="mail-card__pills">
            <span className={`ops-status-pill ops-status-pill--${item.status.toLowerCase()}`}>
              {humanizeInvoiceQueueStatus(item.status)}
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

        <div className="billing-queue-card__details">
          <div className="mail-card__meta">
            <span>CUIT</span>
            <strong>{item.cuit}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Total</span>
            <strong>{formatAmount(item.total)}</strong>
          </div>
          <div className="mail-card__meta">
            <span>Próximo intento</span>
            <strong>{formatDateTime(item.nextAttemptAt)}</strong>
          </div>
        </div>
      </div>
    </article>
  )
}

const BillingQueueDetailModal = ({
  item,
  onClose
}: {
  item: InvoiceQueueItem
  onClose: () => void
}) => {
  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="billing-queue-detail-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel mail-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="billing-queue-detail-title" className="auth-modal__title">Detalle de solicitud</h1>
            <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.externalId}</p>
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
            <BillingDetailItem label="Estado" value={humanizeInvoiceQueueStatus(item.status)} />
            <BillingDetailItem label="CUIT" value={item.cuit} />
            <BillingDetailItem label="Emisor" value={item.emisor} />
            <BillingDetailItem label="Punto de venta" value={item.puntoVenta ? formatNumber(item.puntoVenta) : '-'} />
            <BillingDetailItem label="Concepto" value={item.concepto ?? '-'} />
            <BillingDetailItem label="Total" value={formatAmount(item.total)} />
            <BillingDetailItem label="Intentos" value={formatNumber(item.attemptCount)} />
            <BillingDetailItem label="Próximo intento" value={formatDateTime(item.nextAttemptAt)} />
            <BillingDetailItem label="Fecha de emisión" value={item.fechaEmision ? formatDateTime(item.fechaEmision) : '-'} />
            <BillingDetailItem label="Emitida" value={item.emittedAt ? formatDateTime(item.emittedAt) : '-'} />
            <BillingDetailItem label="Creada" value={formatDateTime(item.createdAt)} />
            <BillingDetailItem label="Actualizada" value={formatDateTime(item.updatedAt)} />
          </div>

          <div className="comprobante-attempts">
            <div className="comprobante-attempts__header">
              <h2>Intentos de emisión</h2>
              <span>{item.attempts.length}</span>
            </div>
            {item.attempts.length > 0 ? (
              <div className="comprobante-attempts__list">
                {item.attempts.map((attempt) => (
                  <div key={`${attempt.attemptNumber}-${attempt.createdAt}`} className="comprobante-attempt">
                    <div>
                      <strong>Intento {attempt.attemptNumber}</strong>
                      <span>{formatDateTime(attempt.createdAt)}</span>
                    </div>
                    <div className="comprobante-attempt__result">
                      <span>{humanizeInvoiceQueueStatus(attempt.status)}</span>
                      <b>{humanizeResultado(attempt.resultado)}</b>
                    </div>
                    {attempt.errorMessage && (
                      <p>{attempt.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="comprobante-attempts__empty">Todavía no hay intentos registrados para esta solicitud.</p>
            )}
          </div>

          <div className="mail-detail-error">
            <div>
              <IconAlertCircle />
              <strong>Último error</strong>
            </div>
            <p>{item.lastError ?? 'Sin error registrado.'}</p>
          </div>

          <div className="billing-queue-detail__timeline">
            <div>
              <IconBuildingBank />
              <strong>Seguimiento operativo</strong>
            </div>
            <p>
              La solicitud se creó el {formatDateTime(item.createdAt)} y su último cambio fue el {formatDateTime(item.updatedAt)}.
            </p>
            {item.emittedAt && (
              <p>ARCA confirmó la emisión el {formatDateTime(item.emittedAt)}.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const BillingDetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="mail-detail-item">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)
