import { Fragment, useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import { Link } from 'react-router-dom'
import ComprobantesTable from '../components/ComprobantesTable'
import { ComprobanteHeaderInfoProps, Stats } from '../props/ComprobantesProps'
import SubHeaderItem from '../components/SubHeaderItem'
import SectionHeader from '../components/SectionHeader'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import HeaderPill from '../components/HeaderPill'

const ComprobantesPage = () => {
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

  const stats:Stats | null = useMemo(() => {
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
      <SectionHeader
      section='Comprobantes'
      icon={<ComprobanteIcon/>}
      title='Monitor de comprobantes emitidos'
      subtitle='Consultá y auditá tus últimas emisiones agrupadas por punto de venta y tipo AFIP.'
      rightContent={<ComprobanteHeaderInfo lastFetchLabel={lastFetchLabel} filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen}/>} />

      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SubHeaderItem
          title='Importe total'
          content={stats ? formatCurrency.format(stats.totalAmount) : '—'}
          subtitle='Suma de los importes totales recibidos.'
          />
          <SubHeaderItem
          title='Comprobantes listados'
          content={stats ? stats.total.toString() : '—'}
          subtitle='Registros recuperados con los filtros actuales.'
          />
          <SubHeaderItem
          title='Con CAE válido'
          content={stats ? stats.withCae.toString() : '—'}
          subtitle='Cantidad de comprobantes autorizados por AFIP.'/>
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

        <div className="card border border-slate-200 bg-white/95 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">¿Necesitás validar muchos comprobantes?</h2>
              <p className="text-sm text-slate-500">Usá la herramienta de carga masiva por Excel para procesar varios comprobantes en serie.</p>
            </div>
            <Link to="/comprobantes/carga-masiva" className="btn btn-primary">
              Ir a carga masiva
            </Link>
          </div>
        </div>

        {loading && <Loader />}
        <ErrorBox error={error} />
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

const ComprobanteHeaderInfo = (props:ComprobanteHeaderInfoProps) => {
  return(
    <Fragment>
      <HeaderPill label={`Última consulta: ${props.lastFetchLabel}`} dotColor='bg-indigo-500' />
     
            <button type="button" className="btn bg-white" onClick={() => props.setFiltersOpen(prev => !prev)}>
              {props.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
    </Fragment>
  )
}

export default ComprobantesPage;
