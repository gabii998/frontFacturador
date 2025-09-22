import { get, post } from './api'
import type { PuntoVenta, ComprobanteEmitido, FacturaSolicitud, FacturaRespuesta } from '../models/afip'

export const AfipService = {
  puntosVenta: () => get<PuntoVenta[]>('/api/afip/puntos-venta'),
  consultar: (pv: number, tipo: number, nro: number) =>
    get<ComprobanteEmitido | null>(`/api/afip/comprobantes/${pv}/${tipo}/${nro}`),
  listar: (pv: number, tipo: number, params: {desde?: number, hasta?: number, limite?: number}) => {
    const q = new URLSearchParams()
    q.set('pv', String(pv)); q.set('tipo', String(tipo))
    if (params.desde) q.set('desde', String(params.desde))
    if (params.hasta) q.set('hasta', String(params.hasta))
    if (params.limite) q.set('limite', String(params.limite))
    return get<ComprobanteEmitido[]>(`/api/afip/comprobantes?${q.toString()}`)
  },
  emitir: (payload: { emisor: 'MONOTRIBUTO'|'RESPONSABLE_INSCRIPTO', solicitud: FacturaSolicitud, nota?: { tipo: 'NC'|'ND' } }) =>
    post<FacturaRespuesta>('/api/ventas/emitir', payload)
}