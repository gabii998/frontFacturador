import { Fragment, useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import SectionHeader from '../components/SectionHeader'
import PuntoventaIcon from '../icon/PuntoVentaIcon'
import { PuntoVentaHeaderInfoProps, Totals } from '../props/PuntosVentaProps'
import EmptyPuntoVentaIcon from '../icon/EmptyPuntoVentaIcon'
import HeaderPill from '../components/HeaderPill'
import SubHeaderItem from '../components/SubHeaderItem'

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

  const totals:Totals = useMemo(() => {
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
        icon={<PuntoventaIcon />}
        title='Gestioná la ventanilla de emisión AFIP'
        subtitle='Consultá los puntos de venta autorizados, verificá bloqueos o bajas y mantené visible qué sucursales pueden emitir comprobantes.'
        rightContent={<PuntosVentaHeaderInfo totals={totals} lastSyncLabel={lastSyncLabel} />} 
        bottomContent={<PuntosVentaSubheader totals={totals}/>}
        />


      <section className="space-y-6">
       

        {loading && <Loader />}
        <ErrorBox error={error} />

        {!loading && !error && (
          data.length > 0 ? (
            <PuntosVentaTable data={data} />
          ) : (
            <div className="card flex flex-col items-center gap-5 py-12 text-slate-500">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-inner">
                <EmptyPuntoVentaIcon/>
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

const PuntosVentaSubheader = ({totals}:{totals:Totals}) => {
  return(<div>
    <SubHeaderItem
          title='Total habilitados'
          content={totals.total.toString()}
          />

          <SubHeaderItem
          title='Activos'
          content={totals.activos.toString()}
          />

          <SubHeaderItem
          title='Bloqueados / Baja'
          content={(totals.bloqueados + totals.dadosDeBaja).toString()}
          />
  </div>)
}

const PuntosVentaHeaderInfo = (props:PuntoVentaHeaderInfoProps) => {
  return (<Fragment>
    <HeaderPill label={`${props.totals.activos} activos · ${props.totals.total} en total`} dotColor='bg-emerald-500'/>
   <HeaderPill label={`Última sincronización: ${props.lastSyncLabel}`} dotColor='bg-blue-500' />
  </Fragment>)
}

export default PuntosVentaPage;
