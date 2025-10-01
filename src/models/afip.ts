export interface PuntoVenta {
  nro: number
  emisionTipo: string
  bloqueado: boolean
  fchBaja?: string | null
}
export interface ComprobanteEmitido {
  tipoAfip: number
  puntoVenta: number
  numero: number
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
  cae?: string | null
  caeVencimiento?: string | null
  tipo: any
  puntoVenta: number
  numero: number
  resultado: string
  observaciones: string[]
  errores: string[]
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
