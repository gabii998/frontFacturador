import { Fragment, useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import { useNavigate } from 'react-router-dom'
import ComprobantesTable from '../components/ComprobantesTable'
import { ComprobanteHeaderInfoProps, FiltrosProps, Stats } from '../props/ComprobantesProps'
import SectionHeader from '../components/SectionHeader'
import { IconFileTypeXls, IconFilter, IconInfoCircle, IconInvoice, IconLoader, IconRestore, IconSearch } from '@tabler/icons-react'
import SubHeaderItemProps from '../props/SubHeaderItemProps'
import Subheader from '../components/Subheader'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'

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
        icon={<IconInvoice />}
        title='Monitor de comprobantes emitidos'
        subtitle='Consultá y auditá tus últimas emisiones agrupadas por punto de venta y tipo AFIP.'
        rightContent={<ComprobanteHeaderInfo filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />}
        bottomContent={<ComprobanteHeaderSubtitle stats={stats} formatCurrency={formatCurrency} lastFetchLabel={lastFetchLabel} />}
      />

      <section className="space-y-6">


        {filtersOpen && (
          <FiltrosComprobantes {...{ loading, setPv, setTipo, setLimite, fetchData, pv, tipo, limite }} />
        )}

        {loading && <LoadingContent/>}
        <ErrorBox error={error} />
        {!loading && !error && (
          data.length > 0 ? (
            <ComprobantesTable data={data} />
          ) : (
            <EmptyContent
              title='No hay comprobantes para mostrar'
              subtitle='Ajustá los filtros o verificá que AFIP haya emitido comprobantes para este punto de venta y tipo.'
              icon={ <IconInfoCircle/> } />
          )
        )}
      </section>

    </div>
  )
}

const ComprobanteHeaderSubtitle = ({ stats, formatCurrency, lastFetchLabel }: { stats: Stats | null, formatCurrency: any, lastFetchLabel: string | null }) => {
  const items: SubHeaderItemProps[] = [
    { title: 'Importe total', content: stats ? formatCurrency.format(stats.totalAmount) : '—' },
    { title: 'Comprobantes listados', content: stats ? stats.total.toString() : '—' },
    { title: 'Con CAE válido', content: stats ? stats.withCae.toString() : '—' },
    { title: 'Última consulta', content: lastFetchLabel ? lastFetchLabel : '—' }
  ]

  return (<Subheader props={items} />)
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
