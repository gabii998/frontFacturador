import { Fragment, useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import { useNavigate } from 'react-router-dom'
import ComprobantesTable from '../components/ComprobantesTable'
import { ComprobanteHeaderInfoProps, FiltrosProps } from '../props/ComprobantesProps'
import SectionHeader from '../components/SectionHeader'
import { IconFileTypeXls, IconFilter, IconInfoCircle, IconInvoice, IconLoader, IconRestore, IconSearch } from '@tabler/icons-react'
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
  const [filtersOpen, setFiltersOpen] = useState(false)

  async function fetchData(nextPv = pv, nextTipo = tipo, nextLimite = limite) {
    setLoading(true); setError(undefined)
    try {
      const res = await AfipService.listar(nextPv, nextTipo, { limite: nextLimite })
      setData(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE) }, [])

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<IconInvoice />}
        title='Comprobantes'
        subtitle='Consultá y auditá tus últimas emisiones agrupadas por punto de venta y tipo AFIP.'
        rightContent={<ComprobanteHeaderInfo filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />}
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
  const enableExcel = import.meta.env.VITE_ENABLE_EXCEL_UPLOAD ?? false;
  const navigate = useNavigate();
  return (
    <Fragment>

      <button type="button" className="btn bg-white" onClick={() => props.setFiltersOpen(prev => !prev)}>
        <IconFilter />{props.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
      </button>

      {enableExcel && <button type="button" className="btn bg-white text-emerald-700" onClick={() => navigate("/comprobantes/carga-masiva")}>
        <IconFileTypeXls />  Cargar excel
      </button>}
    </Fragment>
  )
}

export default ComprobantesPage;
