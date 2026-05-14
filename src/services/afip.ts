import { get, post } from './api'
import type { PuntoVenta, ComprobanteEmitido, FacturaSolicitud, PadronInfo, FacturaRespuesta } from '../models/afip'

export const AfipService = {
  puntosVenta: (estado?: 'activos' | 'bloqueados' | 'baja') =>
    get<PuntoVenta[]>(estado ? `/api/afip/puntos-venta?estado=${encodeURIComponent(estado)}` : '/api/afip/puntos-venta'),
  consultar: (pv: number, tipo: number, nro: number) =>
    get<ComprobanteEmitido | null>(`/api/afip/comprobantes/${pv}/${tipo}/${nro}`),
  listar: (pv: number, tipo: number, params: {desde?: number, hasta?: number, limite?: number, estado?: 'proceso' | 'observados' | 'total'}) => {
    const q = new URLSearchParams()
    q.set('pv', String(pv)); q.set('tipo', String(tipo))
    if (params.desde) q.set('desde', String(params.desde))
    if (params.hasta) q.set('hasta', String(params.hasta))
    if (params.limite) q.set('limite', String(params.limite))
    if (params.estado && params.estado !== 'total') q.set('estado', params.estado)
    return get<ComprobanteEmitido[]>(`/api/afip/comprobantes?${q.toString()}`)
  },
  emitir: (payload: { emisor: 'MONOTRIBUTO'|'RESPONSABLE_INSCRIPTO', solicitud: FacturaSolicitud, nota?: { tipo: 'NC'|'ND' }, origen?: 'BULK' }) =>
    post<FacturaRespuesta>('/api/ventas/emitir', payload),
  descargarComprobantePdf: (pv: number, tipo: number, numero: number) =>
    get<ArrayBuffer>(`/api/afip/comprobantes/pdf?pv=${pv}&tipo=${tipo}&numero=${numero}`, {
      headers: { Accept: 'application/pdf' }
    }),
  cancelarReintentosComprobanteFallido: (queueId: string) =>
    post<ArrayBuffer>(`/api/afip/comprobantes/cola/${encodeURIComponent(queueId)}/cancelar-reintentos`),
  padron: (cuit: string) => get<PadronInfo>(`/api/afip/padron?cuit=${encodeURIComponent(cuit)}`)
}
