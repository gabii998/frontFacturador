import { useState } from 'react'
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
  if (!value) return '—'
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
  if (typeof value !== 'number') return '—'
  return currencyFormatter.format(value)
}

const formatDoc = (docTipo?: number | null, docNro?: number | null) => {
  if (!docTipo && !docNro) return '—'
  const typeLabel = docTipo ? docTypeMap[docTipo] ?? `Doc ${docTipo}` : 'Documento'
  if (!docNro) return typeLabel
  return `${typeLabel} ${docNro.toLocaleString('es-AR')}`
}

const padNumber = (value: number, size: number) => value.toString().padStart(size, '0')

const METADATA_ERROR_MESSAGE = 'No es posible descargar el comprobante hasta completar los datos del emisor en la configuración.'

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

export default function ComprobantesTable({ data }: { data: ComprobanteEmitido[] }){
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
    <div className="card w-full border border-slate-200 bg-white/95 shadow-sm p-0">
     
      <div className="overflow-x-auto">
        <table className="table min-w-full md:min-w-[60rem]">
          <thead>
            <tr>
              <th className="th rounded-tl-2xl">Comprobante</th>
              <th className="th">Emisión</th>
              <th className="th">Importes</th>
              <th className="th">Cliente</th>
              <th className="th">CAE</th>
              <th className="th rounded-tr-2xl">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map(c => {
              const caeExpiry = parseAfipDate(c.caeVto)
              const hasCAE = Boolean(c.cae)
              const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
              const rowHasAlerts = c.errores.length > 0
              const docLabel = formatDoc(c.docTipo, c.docNro)

              return (
                <tr
                  key={`${c.puntoVenta}-${c.tipoAfip}-${c.numero}`}
                  className={`border-b transition-colors ${rowHasAlerts ? 'bg-rose-50/80 border-rose-100 hover:bg-rose-100/70' : 'border-slate-100 hover:bg-slate-50/80'}`}
                >
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-800">
                        {tipoMap[c.tipoAfip] ?? `Tipo ${c.tipoAfip}`} · #{padNumber(c.numero, 8)}
                      </span>
                      <span className="text-xs text-slate-500">PV {padNumber(c.puntoVenta, 4)}</span>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-800">{formatAfipDate(c.fechaCbte)}</span>
                      {c.caeVto && (
                        <span className="text-xs text-slate-500">CAE vence {formatAfipDate(c.caeVto)}</span>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-800">{formatAmount(c.impTotal)}</span>
                      <span className="text-xs text-slate-500">
                        Neto {formatAmount(c.impNeto)} · IVA {formatAmount(c.impIva)}
                      </span>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-800">{docLabel}</span>
                      {typeof c.concepto === 'number' && (
                        <span className="text-xs text-slate-500">
                          {conceptoMap[c.concepto] ?? `Concepto ${c.concepto}`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          !hasCAE
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : caeValid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {!hasCAE ? 'Sin CAE' : caeValid ? 'CAE vigente' : 'CAE vencido'}
                      </span>
                      <span className="font-mono text-xs text-slate-500">{c.cae ?? '—'}</span>
                    </div>
                  </td>
            
                  <td className="td">
                    {metadataUnavailable ? (
                      <span className="text-xs font-medium text-slate-400">
                        {METADATA_ERROR_MESSAGE}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownload(c)}
                        disabled={downloadingId === `${c.puntoVenta}-${c.tipoAfip}-${c.numero}`}
                      >
                        {downloadingId === `${c.puntoVenta}-${c.tipoAfip}-${c.numero}` ? 'Descargando…' : 'Descargar PDF'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {downloadError && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {downloadError}
        </div>
      )}
    </div>
  )
}
