import type { Concepto, FacturaRespuesta } from '../models/afip'

type DateValidationInput = {
  concepto: Concepto
  fechaEmision?: string
  servicioDesde?: string
  servicioHasta?: string
  vencimientoPago?: string
  requestDate?: string
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const AFIP_SERVICE_DATE_RANGE_DAYS = 10

export const getTodayIsoDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const validateAfipDates = (input: DateValidationInput): string | null => {
  if (!isIsoDate(input.fechaEmision)) {
    return 'Ingresa una fecha de comprobante valida.'
  }

  if (input.concepto !== 'PRODUCTOS') {
    const requestDate = isIsoDate(input.requestDate) ? input.requestDate : getTodayIsoDate()
    if (!isWithinAllowedAfipServiceDateRange(input.fechaEmision, requestDate)) {
      const minDate = shiftIsoDate(requestDate, -AFIP_SERVICE_DATE_RANGE_DAYS)
      const maxDate = shiftIsoDate(requestDate, AFIP_SERVICE_DATE_RANGE_DAYS)
      return `Para servicios o productos y servicios, la fecha del comprobante debe estar entre ${formatIsoDate(minDate)} y ${formatIsoDate(maxDate)}.`
    }
  }

  if (input.concepto === 'PRODUCTOS') {
    return null
  }

  if (!isIsoDate(input.servicioDesde) || !isIsoDate(input.servicioHasta)) {
    return 'Completa las fechas Desde y Hasta del servicio.'
  }
  if (compareIsoDates(input.servicioHasta, input.servicioDesde) < 0) {
    return 'La fecha Hasta no puede ser anterior a Desde.'
  }
  if (compareIsoDates(input.servicioHasta, input.fechaEmision) > 0) {
    return 'La fecha Hasta no puede ser posterior a la fecha del comprobante.'
  }
  if (!isIsoDate(input.vencimientoPago)) {
    return 'Ingresa un vencimiento de pago valido.'
  }
  const latestReference = maxIsoDate(input.servicioHasta, input.fechaEmision)
  if (compareIsoDates(input.vencimientoPago, latestReference) < 0) {
    return 'El vencimiento debe ser igual o posterior al fin del servicio y a la fecha del comprobante.'
  }
  return null
}

export const describeAfipRejection = (resp: FacturaRespuesta): string => {
  const reasons = [...(resp.errores ?? []), ...(resp.observaciones ?? [])]
    .map(item => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0))
  const detail = reasons.length ? reasons.join(' - ') : 'Verifica la fecha, numeracion y los datos informados.'
  return `AFIP rechazo la solicitud (${resp.resultado}). ${detail}`
}

const isIsoDate = (value?: string | null): value is string => (
  Boolean(value && ISO_DATE_REGEX.test(value))
)

const compareIsoDates = (a: string, b: string): number => (
  a.localeCompare(b)
)

const maxIsoDate = (a: string, b: string): string => (
  compareIsoDates(a, b) >= 0 ? a : b
)

const isWithinAllowedAfipServiceDateRange = (fechaEmision: string, requestDate: string): boolean => {
  const minDate = shiftIsoDate(requestDate, -AFIP_SERVICE_DATE_RANGE_DAYS)
  const maxDate = shiftIsoDate(requestDate, AFIP_SERVICE_DATE_RANGE_DAYS)
  return compareIsoDates(fechaEmision, minDate) >= 0 && compareIsoDates(fechaEmision, maxDate) <= 0
}

const shiftIsoDate = (value: string, days: number): string => {
  const date = parseIsoDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return toIsoDate(date)
}

const parseIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const toIsoDate = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatIsoDate = (value: string): string => {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
