import { useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import { IconExclamationCircle } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import { usePrivateTopbarActions } from '../contexts/PrivateTopbarContext'

const PuntosVentaPage = () => {
  const [data, setData] = useState<PuntoVenta[]>([])
  const [viewMode, setViewMode] = useState<'activos' | 'bloqueados' | 'baja'>('activos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  const summary = useMemo(() => {
    const activos = data.filter((pv) => !pv.bloqueado && !pv.fchBaja).length
    const bloqueados = data.filter((pv) => pv.bloqueado).length
    const dadosDeBaja = data.filter((pv) => pv.fchBaja).length
    return { activos, bloqueados, dadosDeBaja }
  }, [data])

  const filteredData = useMemo(() => {
    switch (viewMode) {
      case 'bloqueados':
        return data.filter((pv) => pv.bloqueado)
      case 'baja':
        return data.filter((pv) => Boolean(pv.fchBaja))
      default:
        return data.filter((pv) => !pv.bloqueado && !pv.fchBaja)
    }
  }, [data, viewMode])

  useEffect(() => {
    setLoading(true)
    setError(undefined)
    AfipService.puntosVenta()
      .then(list => {
        setData(list)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const topbarActions = useMemo(() => {
    if (loading || error || data.length === 0) return null
    return (
      <div className="mobile-section-summary">
        <div className="puntos-venta-counter puntos-venta-counter--ok">
          <span>Activos</span>
          <strong>{summary.activos}</strong>
        </div>
        <div className="puntos-venta-counter puntos-venta-counter--warn">
          <span>Bloqueados</span>
          <strong>{summary.bloqueados}</strong>
        </div>
        <div className="puntos-venta-counter puntos-venta-counter--muted">
          <span>Baja</span>
          <strong>{summary.dadosDeBaja}</strong>
        </div>
      </div>
    )
  }, [data.length, error, loading, summary])

  usePrivateTopbarActions(topbarActions)

  return (
    <div className="space-y-6">
      <section className="space-y-6">
        {loading && <LoadingContent />}
        <ErrorBox error={error} />

        {!loading && !error && (
          data.length > 0 ? (
            <>
              {filteredData.length > 0 ? (
                <PuntosVentaTable
                  data={filteredData}
                  summary={summary}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              ) : (
                <>
                  <PuntosVentaTable
                    data={[]}
                    summary={summary}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                  <EmptyContent
                    title={
                      viewMode === 'bloqueados'
                        ? 'No hay puntos de venta bloqueados'
                        : viewMode === 'baja'
                          ? 'No hay puntos de venta dados de baja'
                          : 'No hay puntos de venta activos'
                    }
                    subtitle='Cambiá la vista o revisá el estado publicado por AFIP para este contribuyente.'
                    icon={<IconExclamationCircle size={50}/>}
                  />
                </>
              )}
            </>
          ) : (
            <EmptyContent 
            title='Sin puntos de venta disponibles' 
            subtitle='AFIP todavía no publicó puntos de venta para tu CUIT. Revisá la configuración o volvé a intentarlo más tarde.'
            icon={<IconExclamationCircle size={50}/>}
            />
          )
        )}
      </section>
    </div>
  )
}

export default PuntosVentaPage;
