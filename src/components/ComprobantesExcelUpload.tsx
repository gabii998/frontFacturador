import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'

interface ParsedRow {
  id: string
  index: number
  puntoVenta: number
  tipo: number
  numero: number
  status: UploadStatus
  message?: string
  comprobante?: ComprobanteEmitido | null
}

type UploadStatus = 'pending' | 'processing' | 'success' | 'not-found' | 'error'

type StatusMeta = {
  label: string
  badge: string
}

const STATUS_META: Record<UploadStatus, StatusMeta> = {
  pending: {
    label: 'Pendiente',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200'
  },
  processing: {
    label: 'Consultando…',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200'
  },
  success: {
    label: 'Encontrado',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  'not-found': {
    label: 'No encontrado',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200'
  },
  error: {
    label: 'Error',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200'
  }
}

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, '')

const getReadableError = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message
  }
  return 'Error inesperado al consultar AFIP'
}

const integerValue = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9-]/g, '')
    if (cleaned.length === 0) return null
    const parsed = Number(cleaned)
    if (!Number.isFinite(parsed)) return null
    return Math.trunc(parsed)
  }
  return null
}

const padNumber = (value: number, size: number) => value.toString().padStart(size, '0')

const formatAfipDate = (value?: string | null) => {
  if (!value) return null
  if (value.includes('-')) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('es-AR')
  }
  if (value.length === 8) {
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6)) - 1
    const day = Number(value.slice(6, 8))
    const parsed = new Date(year, month, day)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('es-AR')
  }
  return null
}

export default function ComprobantesExcelUpload(){
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [parsingError, setParsingError] = useState<string | null>(null)
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [processing, setProcessing] = useState(false)

  const stats = useMemo(() => {
    if (!rows.length) return null
    const statusCounter = rows.reduce<Record<UploadStatus, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1
      return acc
    }, { pending: 0, processing: 0, success: 0, 'not-found': 0, error: 0 })

    return {
      total: rows.length,
      ...statusCounter
    }
  }, [rows])

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    setParsingError(null)
    setParsingWarnings([])
    setRows([])

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      if (!workbook.SheetNames.length) throw new Error('El archivo no contiene hojas válidas')
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!firstSheet) throw new Error('No se encontró la primera hoja del archivo')

      const entries = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null })
      if (entries.length === 0) throw new Error('El archivo no tiene filas con datos')

      const warnings: string[] = []
      const parsed: ParsedRow[] = []

      entries.forEach((entry, entryIndex) => {
        const normalized = Object.entries(entry).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (!key) return acc
          acc[normalizeKey(String(key))] = value
          return acc
        }, {})

        const pvValue =
          normalized.puntoventa ??
          normalized.puntodeventa ??
          normalized.punto ??
          normalized.pv

        const tipoValue =
          normalized.tipoafip ??
          normalized.tipocomprobante ??
          normalized.tipo ??
          normalized.t ??
          normalized.codigotipo

        const nroValue =
          normalized.numerocomprobante ??
          normalized.numerodocumento ??
          normalized.numero ??
          normalized.nro ??
          normalized.comprobante

        const puntoVenta = integerValue(pvValue)
        const tipo = integerValue(tipoValue)
        const numero = integerValue(nroValue)

        if (puntoVenta === null || tipo === null || numero === null) {
          warnings.push(`Fila ${entryIndex + 2}: faltan datos obligatorios (PV, tipo, número)`)
          return
        }

        parsed.push({
          id: `${puntoVenta}-${tipo}-${numero}-${entryIndex}`,
          index: entryIndex,
          puntoVenta,
          tipo,
          numero,
          status: 'pending'
        })
      })

      if (!parsed.length) {
        throw new Error('No se encontraron filas con los datos obligatorios PV, Tipo y Número.')
      }

      setParsingWarnings(warnings)
      setRows(parsed)
      setFileName(file.name)
    } catch (error) {
      setParsingError(getReadableError(error))
      setFileName('')
      resetFileInput()
    }
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFile(file)
  }

  const processRows = async () => {
    setProcessing(true)
    for (let index = 0; index < rows.length; index++) {
      const current = rows[index]
      if (!current || current.status !== 'pending') continue
      setRows(prev => prev.map(row => row.id === current.id ? { ...row, status: 'processing', message: undefined } : row))
      try {
        const comprobante = await AfipService.consultar(current.puntoVenta, current.tipo, current.numero)
        if (comprobante) {
          const caeLabel = comprobante.cae ? `CAE ${comprobante.cae}` : 'Sin CAE informado'
          const fechaLabel = formatAfipDate(comprobante.fechaCbte)
          const messageParts = [caeLabel]
          if (fechaLabel) messageParts.push(`Emisión ${fechaLabel}`)
          setRows(prev => prev.map(row => (
            row.id === current.id
              ? { ...row, status: 'success', message: messageParts.join(' · '), comprobante }
              : row
          )))
        } else {
          setRows(prev => prev.map(row => (
            row.id === current.id
              ? { ...row, status: 'not-found', message: 'No se encontró el comprobante en AFIP', comprobante: null }
              : row
          )))
        }
      } catch (error) {
        setRows(prev => prev.map(row => (
          row.id === current.id
            ? { ...row, status: 'error', message: getReadableError(error), comprobante: undefined }
            : row
        )))
      }
    }
    setProcessing(false)
  }

  const handleProcess = () => {
    void processRows()
  }

  const resetUpload = () => {
    setRows([])
    setParsingError(null)
    setParsingWarnings([])
    setProcessing(false)
    setFileName('')
    resetFileInput()
  }

  return (
    <section className="card space-y-5 border border-slate-200 bg-white/95 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">Carga masiva desde Excel</h2>
          <p className="text-sm text-slate-500">Subí un archivo con las columnas Punto de Venta, Tipo y Número para consultar el estado en AFIP uno por uno.</p>
        </div>
        {rows.length > 0 && (
          <button type="button" className="btn btn-light" onClick={resetUpload} disabled={processing}>
            Reiniciar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <label className="flex h-32 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 text-center transition-colors hover:border-slate-300 hover:bg-slate-100">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={onFileChange}
            disabled={processing}
          />
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">Seleccioná un archivo Excel</p>
            <p className="text-xs text-slate-500">Formatos compatibles: .xlsx, .xls</p>
          </div>
          {fileName && (<p className="text-xs text-slate-500">Archivo seleccionado: {fileName}</p>)}
        </label>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm text-slate-600 shadow-inner">
          <p className="font-medium text-slate-800">Formato sugerido</p>
          <ul className="list-disc pl-5 text-xs leading-relaxed text-slate-500">
            <li>Encabezados: PuntoVenta, Tipo, Numero</li>
            <li>Los números pueden estar sin ceros a la izquierda</li>
            <li>Una fila por comprobante a consultar</li>
          </ul>
          {stats && (
            <div className="mt-1 grid gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total filas</span>
                <span className="font-semibold text-slate-700">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pendientes</span>
                <span className="font-semibold text-slate-700">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Encontrados</span>
                <span className="font-semibold text-emerald-600">{stats.success}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">No encontrados</span>
                <span className="font-semibold text-amber-600">{stats['not-found']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Errores</span>
                <span className="font-semibold text-rose-600">{stats.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {parsingError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {parsingError}
        </div>
      )}

      {parsingWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          <p className="font-medium">Advertencias detectadas</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {parsingWarnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Resultado de la consulta</p>
              <p className="text-xs text-slate-500">Procesá para verificar cada comprobante en AFIP. El proceso se ejecuta en serie.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={processing || rows.every(row => row.status !== 'pending')}
            >
              {processing ? 'Consultando…' : 'Procesar comprobantes'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table min-w-full">
              <thead>
                <tr>
                  <th className="th">Comprobante</th>
                  <th className="th">Estado</th>
                  <th className="th">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const meta = STATUS_META[row.status]
                  const comprobante = row.comprobante
                  const fechaEmision = comprobante ? formatAfipDate(comprobante.fechaCbte) : null

                  return (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="td align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-semibold text-slate-800">
                            PV {padNumber(row.puntoVenta, 4)} · Tipo {row.tipo}
                          </span>
                          <span className="font-mono text-xs text-slate-500">#{padNumber(row.numero, 8)}</span>
                          {fechaEmision && (
                            <span className="text-xs text-slate-500">Emisión {fechaEmision}</span>
                          )}
                        </div>
                      </td>
                      <td className="td align-top">
                        <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                          {meta.label}
                        </span>
                      </td>
                      <td className="td align-top">
                        {row.message ? (
                          <span className="text-sm text-slate-600">{row.message}</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
