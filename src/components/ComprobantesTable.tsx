import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  IconAlertCircle,
  IconCircleCheck,
  IconClockExclamation,
  IconDownload,
  IconLoader2,
  IconReceipt,
  IconUser
} from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { ComprobanteEmitido } from '../models/afip'
import { AfipService } from '../services/afip'
import { ApiError } from '../services/api'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

const tipoMap: Record<number, string> = {
  1: 'Factura A',
  2: 'Nota de Débito A',
  3: 'Nota de Crédito A',
  6: 'Factura B',
  7: 'Nota de Débito B',
  8: 'Nota de Crédito B',
  11: 'Factura C',
  12: 'Nota de Débito C',
  13: 'Nota de Crédito C'
}

const conceptoMap: Record<number, string> = {
  1: 'Productos',
  2: 'Servicios',
  3: 'Productos y servicios'
}

const docTypeMap: Record<number, string> = {
  80: 'CUIT',
  86: 'CUIL',
  89: 'LE',
  90: 'LC',
  96: 'DNI',
  99: 'Sin identificar'
}

const formatAfipDate = (value?: string | null) => {
  if (!value) return '-'
  if (value.includes('-')) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('es-AR')
  }
  if (value.length === 8) {
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6)) - 1
    const day = Number(value.slice(6, 8))
    const parsed = new Date(year, month, day)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('es-AR')
  }
  return value
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return formatAfipDate(value)
  return parsed.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const parseAfipDate = (value?: string | null) => {
  if (!value) return null
  if (value.includes('-')) {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    parsed.setHours(23, 59, 59, 999)
    return parsed
  }
  if (value.length === 8) {
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6)) - 1
    const day = Number(value.slice(6, 8))
    const parsed = new Date(year, month, day)
    if (Number.isNaN(parsed.getTime())) return null
    parsed.setHours(23, 59, 59, 999)
    return parsed
  }
  return null
}

const formatAmount = (value?: number | null) => {
  if (typeof value !== 'number') return '-'
  return currencyFormatter.format(value)
}

const formatDoc = (docTipo?: number | null, docNro?: number | null) => {
  if (!docTipo && !docNro) return '-'
  const typeLabel = docTipo ? docTypeMap[docTipo] ?? `Doc ${docTipo}` : 'Documento'
  if (!docNro) return typeLabel
  return `${typeLabel} ${docNro.toLocaleString('es-AR')}`
}

const padNumber = (value: number, size: number) => value.toString().padStart(size, '0')

const getComprobanteId = (comprobante: ComprobanteEmitido) =>
  comprobante.queueId
    ?? comprobante.externalId
    ?? `${comprobante.puntoVenta}-${comprobante.tipoAfip}-${comprobante.numero ?? 'pending'}`

const getNumeroLabel = (comprobante: ComprobanteEmitido) =>
  typeof comprobante.numero === 'number' && comprobante.numero > 0
    ? `#${padNumber(comprobante.numero, 8)}`
    : 'Pendiente'

const getStatus = (comprobante: ComprobanteEmitido) => comprobante.status ?? 'EMITTED'

const humanizeStatus = (status?: string | null) => {
  switch (status) {
    case 'EMITTED':
      return 'Emitido'
    case 'QUEUED':
      return 'Emitiendo'
    case 'PROCESSING':
      return 'Procesando'
    case 'FAILED':
      return 'Falló'
    default:
      return status ?? '-'
  }
}

const humanizeResultado = (resultado?: string | null) => {
  switch (resultado) {
    case 'A':
      return 'Aprobado'
    case 'R':
      return 'Rechazado'
    case 'QUEUED':
      return 'En proceso'
    default:
      return resultado ?? '-'
  }
}

const canDownloadComprobante = (comprobante: ComprobanteEmitido) =>
  getStatus(comprobante) === 'EMITTED'
  && typeof comprobante.numero === 'number'
  && comprobante.numero > 0
  && Boolean(comprobante.cae)

const METADATA_ERROR_MESSAGE = 'No es posible descargar el comprobante hasta completar los datos del emisor en la configuración.'

function CaeStatusBadge({ comprobante, hasCAE, caeValid }: { comprobante: ComprobanteEmitido, hasCAE: boolean, caeValid: boolean }) {
  const status = getStatus(comprobante)
  if (status === 'QUEUED' || status === 'PROCESSING') {
    return (
      <span className="comprobante-card__status comprobante-card__status--queue">
        <IconLoader2 />
        {status === 'PROCESSING' ? 'Procesando' : 'Emitiendo'}
      </span>
    )
  }
  if (status === 'FAILED') {
    return (
      <span className="comprobante-card__status comprobante-card__status--error">
        <IconAlertCircle />
        Falló
      </span>
    )
  }

  const stateClass = !hasCAE
    ? 'comprobante-card__status--warn'
    : caeValid
      ? 'comprobante-card__status--ok'
      : 'comprobante-card__status--error'

  const label = !hasCAE ? 'Sin CAE' : caeValid ? 'CAE vigente' : 'CAE vencido'
  const icon = !hasCAE ? <IconClockExclamation /> : caeValid ? <IconCircleCheck /> : <IconAlertCircle />

  return (
    <span className={`comprobante-card__status ${stateClass}`}>
      {icon}
      {label}
    </span>
  )
}

function extractErrorCode(error: ApiError): string | undefined {
  const payload = error.payload
  if (payload && typeof payload === 'object') {
    const maybeCode = (payload as any).code
    if (typeof maybeCode === 'string') {
      return maybeCode
    }
  }
  return undefined
}

export default function ComprobantesTable({ data }: { data: ComprobanteEmitido[] }) {
  const today = new Date()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [metadataUnavailable, setMetadataUnavailable] = useState(false)
  const [selectedComprobante, setSelectedComprobante] = useState<ComprobanteEmitido | null>(null)

  const summary = useMemo(() => {
    return data.reduce(
      (acc, comprobante) => {
        const hasCAE = Boolean(comprobante.cae)
        const caeExpiry = parseAfipDate(comprobante.caeVto)
        const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
        const status = getStatus(comprobante)
        acc.total += 1
        acc.importe += typeof comprobante.impTotal === 'number' ? comprobante.impTotal : 0
        if (status === 'QUEUED' || status === 'PROCESSING') acc.enProceso += 1
        if (hasCAE && caeValid) acc.vigentes += 1
        if (!hasCAE) acc.sinCae += 1
        if (hasCAE && !caeValid) acc.vencidos += 1
        if (comprobante.errores.length > 0 || comprobante.observaciones.length > 0) acc.observados += 1
        return acc
      },
      { total: 0, importe: 0, vigentes: 0, sinCae: 0, vencidos: 0, observados: 0, enProceso: 0 }
    )
  }, [data, today])

  async function handleDownload(comprobante: ComprobanteEmitido) {
    if (!canDownloadComprobante(comprobante)) return
    const numero = comprobante.numero
    if (typeof numero !== 'number') return
    const id = `${comprobante.puntoVenta}-${comprobante.tipoAfip}-${numero}`
    setDownloadingId(id)
    setDownloadError(null)
    try {
      const buffer = await AfipService.descargarComprobantePdf(comprobante.puntoVenta, comprobante.tipoAfip, numero)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const pv = padNumber(comprobante.puntoVenta, 4)
      const nro = padNumber(numero, 8)
      link.href = url
      link.download = `comprobante-${pv}-${nro}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      if (error instanceof ApiError) {
        const code = extractErrorCode(error)
        if (code === 'INVOICE_METADATA_MISSING') {
          setMetadataUnavailable(true)
          setDownloadError(METADATA_ERROR_MESSAGE)
        } else {
          setDownloadError(error.message)
        }
      } else {
        const message = error instanceof Error ? error.message : 'No pudimos descargar el PDF'
        setDownloadError(message)
      }
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="comprobantes-list">
      <header className="comprobantes-list__header">
        <div>
          <h2 className="comprobantes-list__title">Comprobantes</h2>
          <p className="comprobantes-list__subtitle">
            Últimas emisiones y comprobantes en proceso para los filtros seleccionados.
          </p>
        </div>
        <div className="comprobantes-list__summary">
          <SummaryItem label="Total" value={summary.total.toString()} />
          <SummaryItem label="En proceso" value={summary.enProceso.toString()} tone="queue" />
          <SummaryItem label="CAE vigente" value={summary.vigentes.toString()} tone="ok" />
          <SummaryItem label="Observados" value={summary.observados.toString()} tone="warn" />
          <SummaryItem label="Importe" value={currencyFormatter.format(summary.importe)} />
        </div>
      </header>

      <div className="comprobantes-list__grid">
        {data.map((comprobante) => {
          const caeExpiry = parseAfipDate(comprobante.caeVto)
          const hasCAE = Boolean(comprobante.cae)
          const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
          const hasAlerts = comprobante.errores.length > 0 || comprobante.observaciones.length > 0
          const id = getComprobanteId(comprobante)
          const docLabel = formatDoc(comprobante.docTipo, comprobante.docNro)
          const downloadable = canDownloadComprobante(comprobante)

          return (
            <article
              key={id}
              className={`comprobante-card ${hasAlerts ? 'comprobante-card--alert' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedComprobante(comprobante)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedComprobante(comprobante)
                }
              }}
            >
              <div className="comprobante-card__body">
                <div className="comprobante-card__content">
                  <div className="comprobante-card__details">
                    <div className="comprobante-card__identity">
                      <strong className="comprobante-card__number">{getNumeroLabel(comprobante)}</strong>
                      <div className="comprobante-card__pills">
                        <span className="comprobante-card__pill comprobante-card__pill--type">{tipoMap[comprobante.tipoAfip] ?? `Tipo ${comprobante.tipoAfip}`}</span>
                        <span className="comprobante-card__pill comprobante-card__pill--concept">{typeof comprobante.concepto === 'number' ? conceptoMap[comprobante.concepto] ?? `Concepto ${comprobante.concepto}` : 'Concepto sin informar'}</span>
                      </div>
                    </div>
                    <div className="comprobante-card__meta">
                      <span><IconReceipt /> {formatAfipDate(comprobante.fechaCbte ?? comprobante.queuedAt)}</span>
                      <span><IconUser /> {docLabel}</span>
                    </div>
                  </div>
                  <div className="comprobante-card__amount">
                    <CaeStatusBadge comprobante={comprobante} hasCAE={hasCAE} caeValid={caeValid} />
                    {metadataUnavailable ? (
                      <span className="comprobante-card__metadata-error">
                        {METADATA_ERROR_MESSAGE}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn comprobante-card__action"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDownload(comprobante)
                        }}
                        disabled={!downloadable || downloadingId === id}
                        aria-label={downloadable ? 'Descargar PDF' : 'PDF disponible cuando se emita'}
                        title={downloadable ? 'Descargar PDF' : 'PDF disponible cuando se emita'}
                      >
                        <IconDownload />
                        <span>{downloadingId === id ? 'Descargando' : 'Descargar'}</span>
                      </button>
                    )}
                  </div>
                  <span className="comprobante-card__separator" aria-hidden />
                  <div className="comprobante-card__total">
                    <span>Total</span>
                    <strong>{formatAmount(comprobante.impTotal)}</strong>
                  </div>
                </div>

                {hasAlerts && (
                  <div className="comprobante-card__alert">
                    <IconAlertCircle />
                    <span>Este comprobante tiene observaciones o errores informados.</span>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {selectedComprobante && createPortal(
        <ComprobanteDetailModal
          comprobante={selectedComprobante}
          today={today}
          downloading={downloadingId === `${selectedComprobante.puntoVenta}-${selectedComprobante.tipoAfip}-${selectedComprobante.numero}`}
          metadataUnavailable={metadataUnavailable}
          onClose={() => setSelectedComprobante(null)}
          onDownload={() => handleDownload(selectedComprobante)}
        />,
        document.body
      )}

      {downloadError && (
        <div className="comprobantes-list__error">
          {downloadError}
        </div>
      )}
    </section>
  )
}

const ComprobanteDetailModal = ({
  comprobante,
  today,
  downloading,
  metadataUnavailable,
  onClose,
  onDownload
}: {
  comprobante: ComprobanteEmitido
  today: Date
  downloading: boolean
  metadataUnavailable: boolean
  onClose: () => void
  onDownload: () => void
}) => {
  const caeExpiry = parseAfipDate(comprobante.caeVto)
  const hasCAE = Boolean(comprobante.cae)
  const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
  const hasAlerts = comprobante.errores.length > 0 || comprobante.observaciones.length > 0
  const downloadable = canDownloadComprobante(comprobante)
  const attempts = comprobante.attempts ?? []

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="comprobante-modal-title">
      <button
        type="button"
        className="auth-modal__backdrop"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <div className="auth-modal__panel comprobante-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="comprobante-modal-title" className="auth-modal__title">
              {tipoMap[comprobante.tipoAfip] ?? `Tipo ${comprobante.tipoAfip}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              PV {padNumber(comprobante.puntoVenta, 4)} · {getNumeroLabel(comprobante)}
            </p>
          </div>
          <button
            type="button"
            className="auth-modal__close"
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CaeStatusBadge comprobante={comprobante} hasCAE={hasCAE} caeValid={caeValid} />
            {metadataUnavailable ? (
              <span className="comprobante-card__metadata-error">{METADATA_ERROR_MESSAGE}</span>
            ) : (
              <button type="button" className="btn comprobante-card__action" onClick={onDownload} disabled={!downloadable || downloading}>
                <IconDownload />
                <span>{downloadable ? (downloading ? 'Descargando' : 'Descargar') : 'PDF pendiente'}</span>
              </button>
            )}
          </div>

          <div className="comprobante-detail-grid">
            <DetailItem label="Fecha de emisión" value={formatAfipDate(comprobante.fechaCbte)} />
            <DetailItem label="Concepto" value={typeof comprobante.concepto === 'number' ? conceptoMap[comprobante.concepto] ?? `Concepto ${comprobante.concepto}` : '-'} />
            <DetailItem label="Cliente" value={formatDoc(comprobante.docTipo, comprobante.docNro)} />
            <DetailItem label="CAE" value={comprobante.cae ?? '-'} />
            <DetailItem label="Vencimiento CAE" value={formatAfipDate(comprobante.caeVto)} />
            <DetailItem label="Total" value={formatAmount(comprobante.impTotal)} emphasis />
            <DetailItem label="Neto" value={formatAmount(comprobante.impNeto)} />
            <DetailItem label="IVA" value={formatAmount(comprobante.impIva)} />
            <DetailItem label="Estado" value={humanizeStatus(getStatus(comprobante))} />
            <DetailItem label="Inicio de emisión" value={formatDateTime(comprobante.queuedAt)} />
          </div>

          <div className="comprobante-attempts">
            <div className="comprobante-attempts__header">
              <h2>Intentos de emisión</h2>
              <span>{attempts.length}</span>
            </div>
            {attempts.length > 0 ? (
              <div className="comprobante-attempts__list">
                {attempts.map((attempt) => (
                  <div key={`${attempt.attemptNumber}-${attempt.createdAt}`} className="comprobante-attempt">
                    <div>
                      <strong>Intento {attempt.attemptNumber}</strong>
                      <span>{formatDateTime(attempt.createdAt)}</span>
                    </div>
                    <div className="comprobante-attempt__result">
                      <span>{humanizeStatus(attempt.status)}</span>
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

          {hasAlerts && (
            <div className="comprobante-detail-alerts">
              {[...comprobante.observaciones, ...comprobante.errores].map((message, index) => (
                <div key={`${message}-${index}`}>
                  <IconAlertCircle />
                  <span>{message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const SummaryItem = ({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'ok' | 'warn' | 'queue' }) => {
  return (
    <div className={`comprobantes-summary comprobantes-summary--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const DetailItem = ({ label, value, emphasis = false }: { label: string; value: ReactNode; emphasis?: boolean }) => {
  return (
    <div className="comprobante-detail-item">
      <span>{label}</span>
      <strong className={emphasis ? 'comprobante-detail-item__value--emphasis' : undefined}>{value}</strong>
    </div>
  )
}
