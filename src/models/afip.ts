export interface PuntoVenta {
  nro: number
  emisionTipo: string
  bloqueado: boolean
  fchBaja?: string | null
}
export interface ComprobanteIntento {
  attemptNumber: number
  status: string
  resultado?: string | null
  createdAt: string
  errorMessage?: string | null
}

export interface ComprobanteEmitido {
  tipoAfip: number
  puntoVenta: number
  numero?: number | null
  fechaCbte?: string | null
  concepto?: number | null
  docTipo?: number | null
  docNro?: number | null
  impTotal?: number | null
  impNeto?: number | null
  impIva?: number | null
  cae?: string | null
  caeVto?: string | null
  observaciones: string[]
  errores: string[]
  status?: 'EMITTED' | 'QUEUED' | 'PROCESSING' | 'FAILED' | 'CANCELLED' | string
  queueId?: string | null
  externalId?: string | null
  queuedAt?: string | null
  attempts?: ComprobanteIntento[]
}
export type Concepto = 'PRODUCTOS'|'SERVICIOS'|'AMBOS'
export type CondicionImpositiva =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'CONSUMIDOR_FINAL'
  | 'EXENTO'
  | 'NO_ALCANZADO'
  | 'SUJETO_NO_CATEGORIZADO'
export type DocumentoTipo = 'CUIT' | 'DNI' | 'SIN_IDENTIFICAR'
export interface Receptor {
  condicionImpositiva: CondicionImpositiva
  documentoTipo: DocumentoTipo
  documentoNumero: string
  pais: 'AR' | 'EXT'
}
export interface FacturaItem {
  descripcion: string
  cantidad: number
  precioUnitario: number
  iva: string
}
export interface FacturaSolicitud {
  externalId: string
  puntoVenta: number
  fechaEmision: string
  concepto: Concepto
  receptorNombre?: string
  receptorDomicilio?: string
  condicionVenta?: string
  receptor: Receptor
  items: FacturaItem[]
  moneda: 'PES'
  cotizacion: number
  servicioDesde?: string
  servicioHasta?: string
  vencimientoPago?: string
  comprobanteAsociado?: {
    tipo: 'FACTURA_C'|'FACTURA_A'|'FACTURA_B'|'NOTA_CREDITO_C'|'NOTA_DEBITO_C'
    puntoVenta: number
    numero: number
    cuitEmisorOriginal: string
  }
}
export interface FacturaRespuesta {
  id?: string
  externalId?: string
  cae?: string | null
  caeVencimiento?: string | null
  tipo?: any
  puntoVenta?: number
  numero?: number | null
  resultado: string
  status?: string
  observaciones?: string[]
  errores?: string[]
}

export interface PadronInfo {
  inicioActividades?: string | null
  domicilio?: {
    direccion?: string | null
    localidad?: string | null
    provincia?: string | null
    codigoPostal?: string | null
    datoAdicional?: string | null
  } | null
}
