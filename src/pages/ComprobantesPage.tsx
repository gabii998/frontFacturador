import { Fragment, useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import { useNavigate } from 'react-router-dom'
import ComprobantesTable from '../components/ComprobantesTable'
import { ComprobanteHeaderInfoProps, FiltrosProps, Stats } from '../props/ComprobantesProps'
import SubHeaderItem from '../components/SubHeaderItem'
import SectionHeader from '../components/SectionHeader'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import { IconFileTypeXls, IconFilter, IconLoader, IconRestore, IconSearch } from '@tabler/icons-react'

const DEFAULT_PV = 2
const DEFAULT_TIPO = 11
const DEFAULT_LIMITE = 20

const ComprobantesPage = () => {
  const [pv, setPv] = useState(DEFAULT_PV)
  const [tipo, setTipo] = useState(DEFAULT_TIPO) // Factura C
  const [limite, setLimite] = useState(DEFAULT_LIMITE)
  const [data, setData] = useState<ComprobanteEmitido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  async function fetchData(nextPv = pv, nextTipo = tipo, nextLimite = limite) {
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

  useEffect(() => { void fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE) }, [])

  const stats: Stats | null = useMemo(() => {
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
        icon={<ComprobanteIcon />}
        title='Monitor de comprobantes emitidos'
        subtitle='Consultá y auditá tus últimas emisiones agrupadas por punto de venta y tipo AFIP.'
        rightContent={<ComprobanteHeaderInfo filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />}
        bottomContent={<ComprobanteHeaderSubtitle stats={stats} formatCurrency={formatCurrency} lastFetchLabel={lastFetchLabel} />}
      />

      <section className="space-y-6">


        {filtersOpen && (
          <FiltrosComprobantes {...{ loading, setPv, setTipo, setLimite, fetchData, pv, tipo, limite }} />
        )}

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

const ComprobanteHeaderSubtitle = ({ stats, formatCurrency, lastFetchLabel }: { stats: Stats | null, formatCurrency: any, lastFetchLabel: string | null }) => {
  return (<div>
    <SubHeaderItem
      title='Importe total'
      content={stats ? formatCurrency.format(stats.totalAmount) : '—'}
    />
    <SubHeaderItem
      title='Comprobantes listados'
      content={stats ? stats.total.toString() : '—'}
    />
    <SubHeaderItem
      title='Con CAE válido'
      content={stats ? stats.withCae.toString() : '—'} />
    <SubHeaderItem
      title='Última consulta'
      content={lastFetchLabel ? lastFetchLabel : '—'} />
  </div>)
}

const FiltrosComprobantes = (props: FiltrosProps) => {
  return (<div className="card space-y-4 flex flex-row">
    <div>
      <div className="flex justify-between flex-col pb-3">
        <h2 className="text-lg font-semibold text-slate-800">Filtros de búsqueda</h2>
        <p className="text-xs text-slate-500">Ajustá los parámetros para consultar comprobantes específicos.</p>
      </div>
      <div className="flex gap-6 pr-7">
        <div>
          <label className="label">Punto de venta</label>
          <input className="input" type="number" value={props.pv} onChange={e => props.setPv(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Tipo de factura</label>
          <select
            className="input"
            value={props.tipo}
            onChange={(e) => props.setTipo(Number(e.target.value))}
          >
            <option value="1">Factura A</option>
            <option value="6">Factura B</option>
            <option value="11">Factura C</option>
          </select>
        </div>
        <div>
          <label className="label">Últimos N</label>
          <input className="input" type="number" value={props.limite} onChange={e => props.setLimite(Number(e.target.value))} />
          <p className="mt-1 text-xs text-gray-500">Máximo de registros a recuperar.</p>
        </div>
      </div>
    </div>
    <div className='flex gap-3 flex-col w-[300px] justify-center'>
      <button
        className="btn justify-center"
        onClick={() => {
          props.setPv(DEFAULT_PV)
          props.setTipo(DEFAULT_TIPO)
          props.setLimite(DEFAULT_LIMITE)
          void props.fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE)
        }}
      ><IconRestore /> Restablecer</button>
      <button
        className="btn btn-primary flex items-start"
        onClick={() => void props.fetchData(props.pv, props.tipo, props.limite)}
        disabled={props.loading}
      >
        {props.loading ? <IconLoader /> : <IconSearch />}
        {props.loading ? 'Consultando…' : 'Buscar'}
      </button>
    </div>
  </div>)
}

const ComprobanteHeaderInfo = (props: ComprobanteHeaderInfoProps) => {
  const navigate = useNavigate();
  return (
    <Fragment>

      <button type="button" className="btn bg-white" onClick={() => props.setFiltersOpen(prev => !prev)}>
        <IconFilter />{props.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
      </button>

      <button type="button" className="btn bg-white text-emerald-700" onClick={() => navigate("/comprobantes/carga-masiva")}>
        <IconFileTypeXls />  Cargar excel
      </button>
    </Fragment>
  )
}

export default ComprobantesPage;
