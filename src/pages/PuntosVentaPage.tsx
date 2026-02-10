import { useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import SectionHeader from '../components/SectionHeader'
import { IconBuildingStore, IconExclamationCircle } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'

const PuntosVentaPage = () => {
  const [data, setData] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

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

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<IconBuildingStore />}
        title='Puntos de venta'
        subtitle='Consultá los puntos de venta autorizados, verificá bloqueos o bajas y mantené visible qué sucursales pueden emitir comprobantes.'
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

export default PuntosVentaPage;
