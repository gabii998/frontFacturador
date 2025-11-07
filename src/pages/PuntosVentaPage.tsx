import { useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import SectionHeader from '../components/SectionHeader'
import { PuntoVentaHeaderInfoProps, Totals } from '../props/PuntosVentaProps'
import { IconBuildingStore, IconExclamationCircle } from '@tabler/icons-react'
import SubHeaderItemProps from '../props/SubHeaderItemProps'
import Subheader from '../components/Subheader'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'

const PuntosVentaPage = () => {
  const [data, setData] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(undefined)
    AfipService.puntosVenta()
      .then(list => {
        setData(list)
        setSyncedAt(new Date())
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const totals: Totals = useMemo(() => {
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
      <SectionHeader
        section='Puntos de venta'
        icon={<IconBuildingStore />}
        title='Gestioná la ventanilla de emisión AFIP'
        subtitle='Consultá los puntos de venta autorizados, verificá bloqueos o bajas y mantené visible qué sucursales pueden emitir comprobantes.'
        collapsible
        bottomContent={(collapsed) => (
          <PuntosVentaSubheader totals={totals} lastSyncLabel={lastSyncLabel} collapsed={collapsed} />
        )}
      />

      <section className="space-y-6">
        {loading && <LoadingContent />}
        <ErrorBox error={error} />

        {!loading && !error && (
          data.length > 0 ? (
            <PuntosVentaTable data={data} />
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

const PuntosVentaSubheader = (props: PuntoVentaHeaderInfoProps & { collapsed?: boolean }) => {
  const items: SubHeaderItemProps[] = [
    { title: 'Total habilitados', content: props.totals.total.toString() },
    { title: 'Activos', content: props.totals.activos.toString() },
    { title: 'Bloqueados / Baja', content: (props.totals.bloqueados + props.totals.dadosDeBaja).toString() },
    { title: 'Última sincronización:', content: `${props.lastSyncLabel}` }
  ]

  return (<Subheader props={items} collapsed={props.collapsed ?? false} />)
}

export default PuntosVentaPage;
