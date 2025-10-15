import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { AfipService } from '../services/afip'
import type { Concepto, CondicionImpositiva, DocumentoTipo, FacturaRespuesta, FacturaSolicitud } from '../models/afip'
import { ExcelHelper } from '../utils/excel'

type EmisorTipo = 'MONOTRIBUTO' | 'RESPONSABLE_INSCRIPTO'
type FacturaSolicitudDraft = Omit<FacturaSolicitud, 'externalId'>

interface ParsedRow {
  id: string
  index: number
  status: UploadStatus
  message?: string
  payload: {
    emisor: EmisorTipo
    solicitud: FacturaSolicitudDraft
  }
  response?: FacturaRespuesta | null
}

type UploadStatus = 'pending' | 'processing' | 'success' | 'error'

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
    label: 'Emitiendo…',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200'
  },
  success: {
    label: 'Emitido',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  },
  error: {
    label: 'Error',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200'
  }
}

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const normalizeKey = (key: string) => key.trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, '')

const removeAccents = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const normalizeEnumValue = (value: string) =>
  removeAccents(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const stringValue = (value: unknown): string | null => {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : null
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return null
}

const integerValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9-]/g, '')
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null
  }
  return null
}

const decimalValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9,.-]/g, '').replace(',', '.')
    if (!normalized) return null
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const excelSerialDateToISO = (serial: number): string | null => {
  const millis = Math.round((serial - 25569) * 86400 * 1000)
  const date = new Date(millis)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

const parseDateValue = (value: unknown): string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialDateToISO(value)
  }
  const str = stringValue(value)
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (/^\d{8}$/.test(str)) {
    const year = str.slice(0, 4)
    const month = str.slice(4, 6)
    const day = str.slice(6, 8)
    return `${year}-${month}-${day}`
  }
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(str)) {
    const [day, month, year] = str.replace(/\//g, '-').split('-')
    return `${year}-${month}-${day}`
  }
  return null
}

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const parseEmisor = (value: unknown, rowLabel: string, warnings: string[]): EmisorTipo => {
  const str = stringValue(value)
  if (!str) {
    warnings.push(`${rowLabel}: sin emisor, se usará MONOTRIBUTO.`)
    return 'MONOTRIBUTO'
  }
  const normalized = normalizeEnumValue(str)
  if (normalized === 'RESPONSABLE_INSCRIPTO' || normalized === 'RI') return 'RESPONSABLE_INSCRIPTO'
  if (normalized === 'MONOTRIBUTO' || normalized === 'MT' || normalized === 'MONO') return 'MONOTRIBUTO'
  warnings.push(`${rowLabel}: emisor "${str}" no reconocido, se usará MONOTRIBUTO.`)
  return 'MONOTRIBUTO'
}

const parseConcepto = (value: unknown, rowLabel: string, warnings: string[]): Concepto => {
  const str = stringValue(value)
  if (!str) {
    warnings.push(`${rowLabel}: sin concepto, se usará PRODUCTOS.`)
    return 'PRODUCTOS'
  }
  const normalized = normalizeEnumValue(str)
  if (normalized === 'SERVICIOS' || normalized === 'SERVICIO') return 'SERVICIOS'
  if (normalized === 'PRODUCTOS' || normalized === 'PRODUCTO') return 'PRODUCTOS'
  warnings.push(`${rowLabel}: concepto "${str}" no reconocido, solo se permite "Productos" o "Servicios". Se usará PRODUCTOS.`)
  return 'PRODUCTOS'
}

const CONDICIONES_IVA: Record<string, CondicionImpositiva> = {
  CONSUMIDOR_FINAL: 'CONSUMIDOR_FINAL',
  MONOTRIBUTO: 'MONOTRIBUTO',
  RESPONSABLE_INSCRIPTO: 'RESPONSABLE_INSCRIPTO',
  EXENTO: 'EXENTO',
  NO_ALCANZADO: 'NO_ALCANZADO',
  SUJETO_NO_CATEGORIZADO: 'SUJETO_NO_CATEGORIZADO'
}

const parseCondicionIva = (value: unknown, rowLabel: string, warnings: string[]): CondicionImpositiva => {
  const str = stringValue(value)
  if (!str) {
    warnings.push(`${rowLabel}: sin condición IVA del receptor, se usará CONSUMIDOR_FINAL.`)
    return 'CONSUMIDOR_FINAL'
  }
  const normalized = normalizeEnumValue(str)
  if (normalized === 'CF') return 'CONSUMIDOR_FINAL'
  if (normalized === 'RI') return 'RESPONSABLE_INSCRIPTO'
  if (normalized === 'MT' || normalized === 'MONO') return 'MONOTRIBUTO'
  if (normalized in CONDICIONES_IVA) return CONDICIONES_IVA[normalized]
  warnings.push(`${rowLabel}: condición IVA "${str}" no reconocida, se usará CONSUMIDOR_FINAL.`)
  return 'CONSUMIDOR_FINAL'
}

const parseDocumentoTipo = (value: unknown, rowLabel: string, warnings: string[]): DocumentoTipo => {
  const str = stringValue(value)
  if (!str) {
    warnings.push(`${rowLabel}: sin tipo de documento, se usará SIN_IDENTIFICAR.`)
    return 'SIN_IDENTIFICAR'
  }
  const normalized = normalizeEnumValue(str)
  if (normalized === 'DNI') return 'DNI'
  if (normalized === 'CUIT' || normalized === 'CUIL') return 'CUIT'
  if (normalized === 'SIN_IDENTIFICAR' || normalized === 'SINIDENTIFICAR' || normalized === 'SINID') return 'SIN_IDENTIFICAR'
  warnings.push(`${rowLabel}: tipo de documento "${str}" no reconocido, se usará SIN_IDENTIFICAR.`)
  return 'SIN_IDENTIFICAR'
}

const parsePais = (value: unknown, rowLabel: string, warnings: string[]): 'AR' | 'EXT' => {
  const str = stringValue(value)
  if (!str) return 'AR'
  const normalized = normalizeEnumValue(str)
  if (normalized === 'AR' || normalized === 'ARGENTINA' || normalized === 'ARG') return 'AR'
  if (normalized === 'EXT' || normalized === 'EXTERIOR' || normalized === 'EXTRANJERO') return 'EXT'
  warnings.push(`${rowLabel}: país "${str}" no reconocido, se usará AR.`)
  return 'AR'
}



const parseIva = (value: unknown, rowLabel: string, warnings: string[]): string => {
  const str = stringValue(value)
  if (!str) {
    warnings.push(`${rowLabel}: sin código de IVA, se usará IVA 0%.`)
    return 'IVA_0'
  }
  const normalized = normalizeEnumValue(str)
  const normalizedWithPrefix = (() => {
    if (normalized === 'IVA0') return 'IVA_0'
    if (normalized === 'IVA21') return 'IVA_21'
    if (normalized === 'IVA105') return 'IVA_10_5'
    if (normalized === 'IVA27') return 'IVA_27'
    if (normalized === 'IVA5') return 'IVA_5'
    if (normalized === 'IVA25') return 'IVA_2_5'
    return normalized.startsWith('IVA') ? normalized : `IVA_${normalized}`
  })()
  const candidate = normalizedWithPrefix
  if (ExcelHelper.IVA_CODES.has(candidate)) return candidate
  warnings.push(`${rowLabel}: código de IVA "${str}" no reconocido, se usará IVA_0.`)
  return 'IVA_0'
}

const getReadableError = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message
  }
  return 'Error inesperado al emitir comprobante'
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
    const initial: Record<UploadStatus, number> = { pending: 0, processing: 0, success: 0, error: 0 }
    const statusCounter = rows.reduce((acc, row) => {
      acc[row.status] += 1
      return acc
    }, initial)
    return { total: rows.length, ...statusCounter }
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

      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { defval: null, header: 1 })
      const mandatoryHeaders = ['puntoventa', 'concepto', 'descripcion', 'cantidad', 'preciounitario']
      const headerRowIndex = rawRows.findIndex(row => {
        if (!Array.isArray(row)) return false
        const normalizedHeaders = row
          .map(cell => {
            const text = stringValue(cell)
            return text ? normalizeKey(text) : ''
          })
          .filter(Boolean)
        return mandatoryHeaders.every(key => normalizedHeaders.includes(key))
      })
      if (headerRowIndex === -1) throw new Error('No se detectó un encabezado válido en el archivo.')
      const headerRow = rawRows[headerRowIndex] ?? []
      const headerKeys = headerRow.map(cell => stringValue(cell) ?? '')
      const normalizedHeaderKeys = headerKeys.map(key => normalizeKey(key))
      const hasEmisorColumn = normalizedHeaderKeys.some(key => (
        key === 'emisor' || key === 'condicionfiscal' || key === 'condicionemisor'
      ))
      const dataRows = rawRows.slice(headerRowIndex + 1)
      const entries = dataRows
        .map((row, index) => {
          const rowArray = Array.isArray(row) ? row : []
          const excelRowNumber = headerRowIndex + index + 2
          const record = headerKeys.reduce<Record<string, unknown>>((acc, header, columnIndex) => {
            if (!header) return acc
            acc[header] = rowArray[columnIndex] ?? null
            return acc
          }, {})
          const hasValues = Object.values(record).some(value => {
            if (value === null || value === undefined) return false
            if (typeof value === 'string') return value.trim().length > 0
            return true
          })
          if (!hasValues) return null
          return { record, rowNumber: excelRowNumber }
        })
        .filter((entry): entry is { record: Record<string, unknown>; rowNumber: number } => Boolean(entry))
      if (!entries.length) throw new Error('No se encontraron filas con datos después del encabezado.')

      const warnings: string[] = []
      const parsed: ParsedRow[] = []
      const today = new Date().toISOString().slice(0, 10)

      entries.forEach(({ record, rowNumber }) => {
        const rowLabel = `Fila ${rowNumber}`
        const normalized = Object.entries(record).reduce<Record<string, unknown>>((acc, [key, value]) => {
          if (!key) return acc
          acc[normalizeKey(String(key))] = value
          return acc
        }, {})

        const puntoVenta = integerValue(
          normalized.puntoventa ??
          normalized.puntodeventa ??
          normalized.punto ??
          normalized.pv
        )
        if (puntoVenta === null) {
          warnings.push(`${rowLabel}: faltan datos obligatorios de Punto de Venta.`)
          return
        }

        let emisor: EmisorTipo = 'MONOTRIBUTO'
        const emisorSource =
          normalized.emisor ??
          normalized.condicionfiscal ??
          normalized.condicionemisor
        if (emisorSource !== undefined && emisorSource !== null && stringValue(emisorSource)) {
          emisor = parseEmisor(emisorSource, rowLabel, warnings)
        } else if (hasEmisorColumn) {
          emisor = parseEmisor(emisorSource, rowLabel, warnings)
        }

        const concepto = parseConcepto(
          normalized.concepto ??
          normalized.tipoconcepto ??
          normalized.conceptocomprobante,
          rowLabel,
          warnings
        )

        const condicionReceptor = parseCondicionIva(
          normalized.condicionivareceptor ??
          normalized.condicioniva ??
          normalized.condiva ??
          normalized.condicionreceptor,
          rowLabel,
          warnings
        )

        const documentoTipo = parseDocumentoTipo(
          normalized.documentotipo ??
          normalized.doctipo ??
          normalized.tipodocumento,
          rowLabel,
          warnings
        )

        const documentoNumeroRaw = stringValue(
          normalized.documentonumero ??
          normalized.docnro ??
          normalized.dni ??
          normalized.cuit ??
          normalized.documento
        )
        let documentoNumero = documentoNumeroRaw
          ? documentoNumeroRaw.replace(/\D/g, '') || documentoNumeroRaw.trim()
          : null
        if (!documentoNumero) {
          documentoNumero = documentoTipo === 'CUIT' ? '00000000000' : '00000000'
          warnings.push(`${rowLabel}: sin número de documento, se usará ${documentoNumero}.`)
        }

        const descripcion = stringValue(
          normalized.descripcion ??
          normalized.detalle ??
          normalized.item ??
          normalized.conceptoitem ??
          normalized.producto
        )
        if (!descripcion) {
          warnings.push(`${rowLabel}: falta la descripción del ítem. La fila se omitirá.`)
          return
        }

        let cantidad = decimalValue(
          normalized.cantidad ??
          normalized.cant
        )
        if (cantidad === null || cantidad <= 0) {
          cantidad = 1
          warnings.push(`${rowLabel}: cantidad inválida, se usará 1.`)
        }

        let precioUnitario = decimalValue(
          normalized.preciounitario ??
          normalized.precio ??
          normalized.monto ??
          normalized.importe
        )
        if (precioUnitario === null || precioUnitario < 0) {
          precioUnitario = 0
          warnings.push(`${rowLabel}: precio unitario inválido, se usará 0.`)
        }

        const iva = parseIva(
          normalized.iva ??
          normalized.alicuota,
          rowLabel,
          warnings
        )

        const receptorNombre = stringValue(
          normalized.receptornombre ??
          normalized.cliente ??
          normalized.razonsocial ??
          normalized.nombre
        )
        const receptorDomicilio = stringValue(
          normalized.receptordomicilio ??
          normalized.domicilio ??
          normalized.direccion
        )
        const condicionVenta = stringValue(
          normalized.condicionventa ??
          normalized.formapago
        )

        const fechaEmision = parseDateValue(
          normalized.fechaemision ??
          normalized.fecha ??
          normalized.emision
        ) || today

        let servicioDesde = parseDateValue(
          normalized.serviciodesde ??
          normalized.desdeservicio
        )
        let servicioHasta = parseDateValue(
          normalized.serviciohasta ??
          normalized.hastaservicio
        )
        let vencimientoPago = parseDateValue(
          normalized.vencimientopago ??
          normalized.fechavencimiento
        )

        if (concepto === 'SERVICIOS') {
          if (!servicioDesde) {
            servicioDesde = fechaEmision
            warnings.push(`${rowLabel}: sin Servicio Desde, se usará la fecha de emisión.`)
          }
          if (!servicioHasta) {
            servicioHasta = servicioDesde
            warnings.push(`${rowLabel}: sin Servicio Hasta, se usará Servicio Desde.`)
          }
          if (!vencimientoPago) {
            vencimientoPago = servicioHasta
            warnings.push(`${rowLabel}: sin Vencimiento de Pago, se usará Servicio Hasta.`)
          }
        } else {
          if (servicioDesde) {
            warnings.push(`${rowLabel}: Servicio Desde se ignorará porque el concepto es Productos.`)
          }
          if (servicioHasta) {
            warnings.push(`${rowLabel}: Servicio Hasta se ignorará porque el concepto es Productos.`)
          }
          servicioDesde = null
          servicioHasta = null
        }

        const pais = parsePais(
          normalized.pais ??
          normalized.receptorpais,
          rowLabel,
          warnings
        )

        const solicitudDraft: FacturaSolicitudDraft = {
          puntoVenta,
          fechaEmision,
          concepto,
          receptorNombre: receptorNombre ?? undefined,
          receptorDomicilio: receptorDomicilio ?? undefined,
          condicionVenta: condicionVenta ?? undefined,
          receptor: {
            condicionImpositiva: condicionReceptor,
            documentoTipo,
            documentoNumero,
            pais
          },
          items: [{
            descripcion,
            cantidad,
            precioUnitario,
            iva
          }],
          moneda: 'PES',
          cotizacion: 1,
          ...(servicioDesde ? { servicioDesde } : {}),
          ...(servicioHasta ? { servicioHasta } : {}),
          ...(vencimientoPago ? { vencimientoPago } : {})
        }

        parsed.push({
          id: generateId(),
          index: rowNumber - 2,
          status: 'pending',
          payload: {
            emisor,
            solicitud: solicitudDraft
          },
          response: null
        })
      })

      if (!parsed.length) {
        throw new Error('No se encontraron filas con los datos obligatorios para emitir (PuntoVenta, descripción, cantidad y precio).')
      }

      setParsingWarnings(warnings)
      setRows(parsed)
      setFileName(file.name)
    } catch (error) {
      setParsingError(error instanceof Error ? error.message : String(error))
      setFileName('')
      resetFileInput()
    }
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await handleFile(file)
  }

  const emitRow = async (target: ParsedRow) => {
    setRows(prev => prev.map(row => (
      row.id === target.id
        ? { ...row, status: 'processing', message: undefined }
        : row
    )))
    try {
      const solicitud: FacturaSolicitud = {
        ...target.payload.solicitud,
        externalId: generateId()
      }
      const response = await AfipService.emitir({
        emisor: target.payload.emisor,
        solicitud
      })
      const messageParts: string[] = []
      if (response.cae) messageParts.push(`CAE ${response.cae}`)
      const caeVto = formatAfipDate(response.caeVencimiento)
      if (caeVto) messageParts.push(`Vence ${caeVto}`)
      if (typeof response.numero === 'number') messageParts.push(`Nro ${padNumber(response.numero, 8)}`)
      if (!messageParts.length) messageParts.push('Emitido correctamente')
      setRows(prev => prev.map(row => (
        row.id === target.id
          ? { ...row, status: 'success', message: messageParts.join(' · '), response }
          : row
      )))
    } catch (error) {
      setRows(prev => prev.map(row => (
        row.id === target.id
          ? { ...row, status: 'error', message: getReadableError(error) }
          : row
      )))
    }
  }

  const processRows = async () => {
    setProcessing(true)
    try {
      for (const row of rows) {
        if (row.status !== 'pending' && row.status !== 'error') continue
        await emitRow(row)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleProcess = () => {
    if (processing) return
    void processRows()
  }

  const handleEmitSingle = (row: ParsedRow) => {
    if (processing) return
    setProcessing(true)
    void emitRow(row).finally(() => setProcessing(false))
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
          <p className="text-sm text-slate-500">Subí un archivo con los datos completos para emitir cada comprobante en forma individual.</p>
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
            <li>Encabezados obligatorios: PuntoVenta, Emisor, Concepto, CondicionIVAReceptor, DocumentoTipo, DocumentoNumero, Descripcion, Cantidad, PrecioUnitario.</li>
            <li>IVA (por ej. IVA_0, IVA_21) y fechas opcionales en formato AAAA-MM-DD. Los importes deben ser numéricos.</li>
            <li>Una fila representa un comprobante a emitir con un único ítem.</li>
          </ul>
          <button
            type="button"
            className="btn btn-light btn-sm self-start"
            onClick={ExcelHelper.generateTemplate}
          >
            Descargar modelo Excel
          </button>
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
                <span className="text-slate-500">En proceso</span>
                <span className="font-semibold text-sky-600">{stats.processing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Emitidos</span>
                <span className="font-semibold text-emerald-600">{stats.success}</span>
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
            {parsingWarnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">Resultado de la emisión</p>
              <p className="text-xs text-slate-500">Emití los comprobantes cargados. El proceso se ejecuta de manera secuencial.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={processing || !rows.some(row => row.status === 'pending' || row.status === 'error')}
            >
              {processing ? 'Emitiendo…' : 'Emitir comprobantes'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Listado de futuros comprobantes</p>
                <p className="text-xs text-slate-500">Revisá los datos que se enviarán a AFIP y monitoreá el resultado de cada emisión.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {rows.length} comprobantes
              </span>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-slate-200">
              {rows.map(row => {
                const meta = STATUS_META[row.status]
                const solicitud = row.payload.solicitud
                const receptor = solicitud.receptor
                const [firstItem] = solicitud.items
                const item = firstItem ?? { descripcion: 'Sin ítem', cantidad: 0, precioUnitario: 0, iva: 'IVA_0' }
                const total = solicitud.items.reduce((acc, curr) => acc + (Number(curr.cantidad) * Number(curr.precioUnitario)), 0)
                const fechaEmision = formatAfipDate(solicitud.fechaEmision)

                return (
                  <div key={row.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-[11px] leading-5 text-slate-400 sm:mt-0.5">#{row.index + 2}</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-800">
                          <span>PV {padNumber(solicitud.puntoVenta, 4)}</span>
                          <span>· {solicitud.concepto}</span>
                          {fechaEmision && <span className="text-xs font-medium text-slate-500">· Emisión {fechaEmision}</span>}
                        </div>
                        <div className="text-xs text-slate-500">
                          {receptor.condicionImpositiva} · {receptor.documentoTipo} {receptor.documentoNumero}
                          {solicitud.receptorNombre ? ` · ${solicitud.receptorNombre}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          Ítem: {item.descripcion} · {item.cantidad} × {currencyFormatter.format(item.precioUnitario)} ({item.iva})
                        </div>
                        <div className="text-xs font-semibold text-slate-700">
                          Total estimado: {currencyFormatter.format(total)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <span className={`inline-flex items-center gap-2 self-start rounded-xl px-3 py-1 text-xs font-semibold sm:self-end ${meta.badge}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                        {meta.label}
                      </span>
                      {row.message ? (
                        <span className="text-sm text-slate-600 sm:text-right">{row.message}</span>
                      ) : (
                        <span className="text-sm text-slate-400 sm:text-right">—</span>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-xs sm:self-end"
                        onClick={() => handleEmitSingle(row)}
                        disabled={processing || row.status === 'processing' || row.status === 'success'}
                      >
                        {row.status === 'success' ? 'Emitido' : 'Emitir'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
