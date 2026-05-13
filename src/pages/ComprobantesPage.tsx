import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import { useNavigate } from 'react-router-dom'
import ComprobantesTable from '../components/ComprobantesTable'
import { ComprobanteHeaderInfoProps, FiltrosProps } from '../props/ComprobantesProps'
import { IconFileTypeXls, IconFilter, IconInfoCircle, IconLoader, IconRestore, IconSearch, IconX } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import { usePrivateTopbarActions } from '../contexts/PrivateTopbarContext'

const DEFAULT_PV = 2
const DEFAULT_TIPO = 11
const DEFAULT_LIMITE = 20

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS'
})

const parseAfipDate = (value?: string | null) => {
  if (!value || value.length !== 8) return null
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6)) - 1
  const day = Number(value.slice(6, 8))
  const date = new Date(year, month, day)
  return Number.isNaN(date.getTime()) ? null : date
}

const getComprobanteStatus = (comprobante: ComprobanteEmitido) => comprobante.status ?? 'EMITTED'

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

  const summary = useMemo(() => {
    const today = new Date()
    return data.reduce(
      (acc, comprobante) => {
        const hasCAE = Boolean(comprobante.cae)
        const caeExpiry = parseAfipDate(comprobante.caeVto)
        const caeValid = hasCAE && (!caeExpiry || caeExpiry >= today)
        const status = getComprobanteStatus(comprobante)
        acc.total += 1
        acc.importe += typeof comprobante.impTotal === 'number' ? comprobante.impTotal : 0
        if (status === 'QUEUED' || status === 'PROCESSING') acc.enProceso += 1
        if (hasCAE && caeValid) acc.vigentes += 1
        if (comprobante.errores.length > 0 || comprobante.observaciones.length > 0) acc.observados += 1
        return acc
      },
      { total: 0, importe: 0, vigentes: 0, observados: 0, enProceso: 0 }
    )
  }, [data])

  const topbarActions = useMemo(
    () => (
      <>
        {data.length > 0 && (
          <div className="mobile-section-summary">
            <div className="comprobantes-summary">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="comprobantes-summary comprobantes-summary--queue">
              <span>En proceso</span>
              <strong>{summary.enProceso}</strong>
            </div>
            <div className="comprobantes-summary comprobantes-summary--warn">
              <span>Observados</span>
              <strong>{summary.observados}</strong>
            </div>
          </div>
        )}
        <ComprobanteHeaderInfo filtersOpen={filtersOpen} setFiltersOpen={setFiltersOpen} />
      </>
    ),
    [data.length, filtersOpen, summary]
  )

  usePrivateTopbarActions(topbarActions)

  return (
    <div className="space-y-6">
      <section className="space-y-6">


        {filtersOpen && (
          <FiltrosComprobantes
            {...{ loading, setPv, setTipo, setLimite, fetchData, pv, tipo, limite }}
            onClose={() => setFiltersOpen(false)}
          />
        )}

        {loading && <LoadingContent/>}
        <ErrorBox error={error} />
        {!loading && !error && (
          data.length > 0 ? (
            <ComprobantesTable data={data} onQueueItemCancelled={() => fetchData(pv, tipo, limite)} />
          ) : (
            <EmptyContent
              title='No hay comprobantes para mostrar'
              subtitle='Ajustá los filtros o verificá que existan comprobantes emitidos o en proceso para este punto de venta y tipo.'
              icon={ <IconInfoCircle/> } />
          )
        )}
      </section>

    </div>
  )
}

const FiltrosComprobantes = (props: FiltrosProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [props])

  const handleSearch = async () => {
    await props.fetchData(props.pv, props.tipo, props.limite)
    props.onClose()
  }

  return createPortal(
    <div className="comprobantes-filters-modal" role="dialog" aria-modal="true" aria-labelledby="comprobantes-filters-title">
      <button type="button" className="comprobantes-filters-modal__backdrop" aria-label="Cerrar filtros" onClick={props.onClose} />
      <div className="comprobantes-filters" onClick={(event) => event.stopPropagation()}>
      <div className="comprobantes-filters__header">
        <div>
          <h2 id="comprobantes-filters-title">Filtros de búsqueda</h2>
          <p>Ajustá los parámetros para consultar comprobantes específicos.</p>
        </div>
        <button type="button" className="comprobantes-filters__close" aria-label="Cerrar filtros" onClick={props.onClose}>
          <IconX />
        </button>
      </div>

      <div className="comprobantes-filters__body">
        <label className="comprobantes-filter-field">
          <span>Punto de venta</span>
          <input className="input" type="number" value={props.pv} onChange={e => props.setPv(Number(e.target.value))} />
        </label>
        <label className="comprobantes-filter-field">
          <span>Tipo de factura</span>
          <select
            className="input"
            value={props.tipo}
            onChange={(e) => props.setTipo(Number(e.target.value))}
          >
            <option value="1">Factura A</option>
            <option value="6">Factura B</option>
            <option value="11">Factura C</option>
          </select>
        </label>
        <label className="comprobantes-filter-field">
          <span>Últimos registros</span>
          <input className="input" type="number" value={props.limite} onChange={e => props.setLimite(Number(e.target.value))} />
        </label>
      </div>

      <div className="comprobantes-filters__actions">
        <button
          type="button"
          className="comprobantes-filters__reset"
          onClick={() => {
            props.setPv(DEFAULT_PV)
            props.setTipo(DEFAULT_TIPO)
            props.setLimite(DEFAULT_LIMITE)
            void props.fetchData(DEFAULT_PV, DEFAULT_TIPO, DEFAULT_LIMITE)
          }}
        >
          <IconRestore /> Restablecer
        </button>
        <button
          type="button"
          className="btn btn-primary comprobantes-filters__submit"
          onClick={() => void handleSearch()}
          disabled={props.loading}
        >
          {props.loading ? <IconLoader className="animate-spin" /> : <IconSearch />}
          {props.loading ? 'Consultando...' : 'Buscar'}
        </button>
      </div>
    </div>
    </div>,
    document.body
  )
}

const ComprobanteHeaderInfo = (props: ComprobanteHeaderInfoProps) => {
  const enableExcel = import.meta.env.VITE_ENABLE_EXCEL_UPLOAD ?? false;
  const navigate = useNavigate();
  return (
    <Fragment>

      <button type="button" className={`comprobantes-filter-toggle ${props.filtersOpen ? 'is-active' : ''}`} onClick={() => props.setFiltersOpen(prev => !prev)}>
        <IconFilter />
        <span className="topbar-action-label">{props.filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
      </button>

      {enableExcel && <button type="button" className="btn bg-white text-emerald-700" onClick={() => navigate("/comprobantes/carga-masiva")}>
        <IconFileTypeXls />
        <span className="topbar-action-label">Cargar excel</span>
      </button>}
    </Fragment>
  )
}

export default ComprobantesPage;
