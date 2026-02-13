import { useState } from 'react'
import { IonBadge, IonButton, IonCard, IonCardContent, IonText } from '@ionic/react'
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
  2: 'Nota de Debito A',
  3: 'Nota de Credito A',
  6: 'Factura B',
  7: 'Nota de Debito B',
  8: 'Nota de Credito B',
  11: 'Factura C',
  12: 'Nota de Debito C',
  13: 'Nota de Credito C'
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
  99: 'Consumidor Final'
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

const METADATA_ERROR_MESSAGE = 'No es posible descargar el comprobante hasta completar los datos del emisor en la configuracion.'

function CaeStatusBadge({ hasCAE, caeValid }: { hasCAE: boolean, caeValid: boolean }) {
  const color = !hasCAE ? 'warning' : caeValid ? 'success' : 'danger'
  const label = !hasCAE ? 'Sin CAE' : caeValid ? 'Vigente' : 'Vencido'
  return <IonBadge className='cae-pill' color={color}>{label}</IonBadge>
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

  async function handleDownload(comprobante: ComprobanteEmitido) {
    const id = `${comprobante.puntoVenta}-${comprobante.tipoAfip}-${comprobante.numero}`
    setDownloadingId(id)
    setDownloadError(null)
    try {
      const buffer = await AfipService.descargarComprobantePdf(comprobante.puntoVenta, comprobante.tipoAfip, comprobante.numero)
      const blob = new Blob([buffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const pv = padNumber(comprobante.puntoVenta, 4)
      const nro = padNumber(comprobante.numero, 8)
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
    <div className="space-y-4">
      <div className="comprobantes-grid">
        {data.map((c) => {
          const caeExpiry = parseAfipDate(c.caeVto)
          const hasCAE = Boolean(c.cae)
          const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
          const rowHasAlerts = c.errores.length > 0
          const docLabel = formatDoc(c.docTipo, c.docNro)
          const rowKey = `${c.puntoVenta}-${c.tipoAfip}-${c.numero}`

          return (
            <IonCard
              key={rowKey}
              className={`comprobante-card ${rowHasAlerts ? 'comprobante-card--alert' : ''}`}
            >
              <IonCardContent>
                <div className="comprobante-card__header">
                  <div className="comprobante-date">
                    {formatAfipDate(c.fechaCbte)}
                  </div>
                  <div>
                    <span className="comprobante-pill">{tipoMap[c.tipoAfip] ?? `Tipo ${c.tipoAfip}`} #{padNumber(c.numero, 8)}</span>
                  </div>

                </div>

                <div className="comprobante-card__meta">
                  <div className="flex flex-col items-end gap-1 text-right">


                  </div>

                  <div className='comprobante-content'>
                    <div className="comprobante-stack">
                      <div className='cae-header'>
                        <div className="comprobante-label">CAE</div>

                        <CaeStatusBadge hasCAE={hasCAE} caeValid={caeValid} />

                      </div>
                      <span className="comprobante-subtitle">{c.cae ?? '-'}</span>
                    </div>

                    <div className="comprobante-stack">
                      <p className="comprobante-label">Cliente</p>
                      <p className="comprobante-title">{docLabel}</p>

                    </div>
                  </div>

                  <div className='comprobante-content'>

                    <div className="comprobante-stack">
                      <p className="comprobante-label">Total</p>
                      <p className="comprobante-kpi">{formatAmount(c.impTotal)}</p>

                    </div>
                    <div className="comprobante-actions">
                      {metadataUnavailable ? (
                        <span className="comprobante-subtle">{METADATA_ERROR_MESSAGE}</span>
                      ) : (
                        <IonButton
                          size="small"
                          fill="outline"
                          onClick={() => handleDownload(c)}
                          disabled={downloadingId === rowKey}
                        >
                          {downloadingId === rowKey ? 'Descargando...' : 'Descargar PDF'}
                        </IonButton>
                      )}
                    </div>
                  </div>




                </div>

                {rowHasAlerts && (
                  <p className="mt-3 text-xs font-semibold text-amber-700">Este comprobante tiene observaciones.</p>
                )}


              </IonCardContent>
            </IonCard>
          )
        })}
      </div>

      {downloadError && (
        <IonText color="danger" className="block rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          {downloadError}
        </IonText>
      )}
    </div>
  )
}
