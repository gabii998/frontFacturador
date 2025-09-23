import { useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'

export default function PuntosVentaPage(){
  const [data, setData] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)

  useEffect(()=>{
    setLoading(true)
    setError(undefined)
    AfipService.puntosVenta()
      .then(list => {
        setData(list)
        setSyncedAt(new Date())
      })
      .catch(setError)
      .finally(()=>setLoading(false))
  },[])

  const totals = useMemo(() => {
    const total = data.length
    const activos = data.filter(item => !item.bloqueado && !item.fchBaja).length
    const bloqueados = data.filter(item => item.bloqueado).length
    const dadosDeBaja = data.filter(item => Boolean(item.fchBaja)).length
    return { total, activos, bloqueados, dadosDeBaja }
  }, [data])

  const lastSyncLabel = useMemo(() => {
    if (syncedAt) return syncedAt.toLocaleString('es-AR')
    if (loading) return 'Sincronizando...'
    return 'Sin datos recientes'
  }, [syncedAt, loading])

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex items-center justify-between gap-6">
          <div className="flex w-1/2 items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-500/20 text-blue-600">
              <svg
                className="h-7 w-7"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="16" y="26" width="32" height="24" rx="4" fill="#fff" />
                <path d="M20 26v-6c0-3 2.4-5.5 5.5-5.5H30l3 6h13c3 0 5.5 2.4 5.5 5.5V32" />
                <path d="M46 18h-8" />
                <circle cx="26" cy="38" r="3" fill="currentColor" />
                <path d="M32 43h10" />
                <path d="M32 50h16" />
              </svg>
            </div>
            <div className="w-screen space-y-2">
              <span className="auth-eyebrow">Puntos de venta</span>
              <h1 className="text-2xl font-semibold text-slate-900">Gestioná la ventanilla de emisión AFIP</h1>
              <p className="text-sm text-slate-600">
                Consultá los puntos de venta autorizados, verificá bloqueos o bajas y mantené visible qué sucursales pueden emitir comprobantes.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-blue-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              {totals.activos} activos · {totals.total} en total
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
              Última sincronización: {lastSyncLabel}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Total habilitados</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{totals.total}</p>
            <p className="mt-1 text-xs text-slate-500">Listado recuperado desde AFIP WSFE.</p>
          </div>
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Activos</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{totals.activos}</p>
            <p className="mt-1 text-xs text-slate-500">Disponibles para emitir comprobantes.</p>
          </div>
          <div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Bloqueados / Baja</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{totals.bloqueados + totals.dadosDeBaja}</p>
            <p className="mt-1 text-xs text-slate-500">Incluye bloqueados ({totals.bloqueados}) y dados de baja ({totals.dadosDeBaja}).</p>
          </div>
        </div>

        {loading && <Loader />}
        {error && <ErrorBox error={error} />}

        {!loading && !error && (
          data.length > 0 ? (
            <PuntosVentaTable data={data} />
          ) : (
            <div className="card flex flex-col items-center gap-5 py-12 text-slate-500">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-inner">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-14 w-14 text-blue-500"
                >
                  <rect x="16" y="26" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="3" fill="white" />
                  <path d="M20 26v-6c0-3 2.4-5.5 5.5-5.5H30l3 6h13c3 0 5.5 2.4 5.5 5.5V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="white" />
                  <path d="M46 18h-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="26" cy="38" r="3" fill="currentColor" />
                  <path d="M32 43h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M32 50h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M18 18l28 28" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="space-y-2 text-center">
                <h2 className="text-lg font-semibold text-slate-700">Sin puntos de venta disponibles</h2>
                <p className="text-sm leading-relaxed">
                  AFIP todavía no publicó puntos de venta para tu CUIT. Revisá la configuración o volvé a intentarlo más tarde.
                </p>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  )
}
