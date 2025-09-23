import { useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import ComprobantesTable from '../components/ComprobantesTable'

export default function ComprobantesPage(){
  const DEFAULT_PV = 2
  const DEFAULT_TIPO = 11
  const DEFAULT_LIMITE = 20

  const [pv, setPv] = useState(DEFAULT_PV)
  const [tipo, setTipo] = useState(DEFAULT_TIPO) // Factura C
  const [limite, setLimite] = useState(DEFAULT_LIMITE)
  const [data, setData] = useState<ComprobanteEmitido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  async function fetchData(nextPv = pv, nextTipo = tipo, nextLimite = limite){
    setLoading(true); setError(undefined)
    try {
      const res = await AfipService.listar(nextPv, nextTipo, { limite: nextLimite })
      setData(res)
      setLastFetch(new Date())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ void fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE) }, [])

  const stats = useMemo(() => {
    if (!data.length) return null
    const total = data.length
    const uniquePV = new Set(data.map(item => item.puntoVenta)).size
    const withCae = data.filter(item => !!item.cae).length
    const totalAmount = data.reduce((sum, item) => sum + (item.impTotal ?? 0), 0)
    const latest = data.reduce<ComprobanteEmitido | undefined>((acc, item) => {
      if (!acc) return item
      return item.numero > acc.numero ? item : acc
    }, undefined)

    return {
      total,
      uniquePV,
      withCae,
      totalAmount,
      latest
    }
  }, [data])

  const formatCurrency = useMemo(() => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }), [])

  const lastFetchLabel = useMemo(() => {
    if (lastFetch) return lastFetch.toLocaleString('es-AR')
    return loading ? 'Consultando…' : 'Sin consultas todavía'
  }, [lastFetch, loading])

  const formatAfipDate = (value?: string | null) => {
    if (!value) return '—'
    if (value.includes('-')) {
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('es-AR')
    }
    if (value.length === 8) {
      const year = value.slice(0, 4)
      const month = value.slice(4, 6)
      const day = value.slice(6, 8)
      return `${day}/${month}/${year}`
    }
    return value
  }

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-100">
        <div className="flex items-center justify-between gap-6">
          <div className="flex w-1/2 items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-500/20 text-blue-600">
              <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="12" width="20" height="14" rx="3" fill="#fff" />
                <path d="M10 12v-4c0-2.2 1.8-4 4-4h4l2 4h6c2.2 0 4 1.8 4 4v3" />
                <path d="M20 8h-6" />
                <circle cx="13" cy="20" r="2" fill="currentColor" />
                <path d="M16 23h8" />
                <path d="M16 27h12" />
              </svg>
            </div>
            <div className="w-screen space-y-2">
              <span className="auth-eyebrow">Comprobantes</span>
              <h1 className="text-2xl font-semibold text-slate-900">Monitor de comprobantes emitidos</h1>
              <p className="text-sm text-slate-600">Consultá y auditá tus últimas emisiones agrupadas por punto de venta y tipo AFIP.</p>
            </div>
          </div>
          <div className="flex flex-col flex-wrap gap-3 text-sm text-indigo-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
              Última consulta: {lastFetchLabel}
            </span>
            <button type="button" className="btn" onClick={() => setFiltersOpen(prev => !prev)}>
              {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Importe total</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{stats ? formatCurrency.format(stats.totalAmount) : '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Suma de los importes totales recibidos.</p>
          </div>
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Comprobantes listados</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{stats ? stats.total : '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Registros recuperados con los filtros actuales.</p>
          </div>
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Con CAE válido</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{stats ? stats.withCae : '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Cantidad de comprobantes autorizados por AFIP.</p>
          </div>
        </div>

        {filtersOpen && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Filtros de búsqueda</h2>
                <p className="text-xs text-slate-500">Ajustá los parámetros para consultar comprobantes específicos.</p>
              </div>
              <button
                className="btn"
                onClick={() => {
                  setPv(DEFAULT_PV)
                  setTipo(DEFAULT_TIPO)
                  setLimite(DEFAULT_LIMITE)
                  void fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE)
                }}
              >Restablecer</button>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="label">Punto de venta</label>
                <input className="input" type="number" value={pv} onChange={e => setPv(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Tipo AFIP</label>
                <input className="input" type="number" value={tipo} onChange={e => setTipo(Number(e.target.value))} />
                <p className="mt-1 text-xs text-gray-500">Ej.: 11=Factura C, 6=Factura B, 1=Factura A</p>
              </div>
              <div>
                <label className="label">Últimos N</label>
                <input className="input" type="number" value={limite} onChange={e => setLimite(Number(e.target.value))} />
                <p className="mt-1 text-xs text-gray-500">Máximo de registros a recuperar.</p>
              </div>
              <div className="flex items-end">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => void fetchData(pv, tipo, limite)}
                  disabled={loading}
                >
                  {loading ? 'Consultando…' : 'Buscar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <Loader />}
        {error && <ErrorBox error={error} />}
        {!loading && !error && (
          data.length > 0 ? (
            <ComprobantesTable data={data} />
          ) : (
            <div className="card flex flex-col items-center gap-4 py-12 text-slate-500">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 shadow-inner">
                <svg
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-14 text-slate-400"
                >
                  <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M16 16h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M16 22h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M16 28h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 12l24 24" stroke="#F87171" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-lg font-semibold text-slate-700">No hay comprobantes para mostrar</h2>
                <p className="text-sm leading-relaxed">
                  Ajustá los filtros o verificá que AFIP haya emitido comprobantes para este punto de venta y tipo.
                </p>
              </div>
            </div>
          )
        )}
      </section>

    </div>
  )
}
