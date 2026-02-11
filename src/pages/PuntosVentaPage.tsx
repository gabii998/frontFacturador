import { useEffect } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import SectionHeader from '../components/SectionHeader'
import { IconBuildingStore, IconExclamationCircle } from '@tabler/icons-react'
import EmptyContent from '../components/EmptyContent'
import LoadingContent from '../components/LoadingContent'
import { useAsyncResource } from '../hooks/useAsyncResource'

const PuntosVentaPage = () => {
  const { data, loading, error, load } = useAsyncResource<PuntoVenta[]>([])

  useEffect(() => {
    void load(() => AfipService.puntosVenta())
  }, [load])

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<IconBuildingStore />}
        title='Puntos de venta'
        subtitle='Consulta los puntos de venta autorizados, verifica bloqueos o bajas y manten visible que sucursales pueden emitir comprobantes.'
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
              subtitle='AFIP todavia no publico puntos de venta para tu CUIT. Revisa la configuracion o vuelve a intentarlo mas tarde.'
              icon={<IconExclamationCircle size={50} />}
            />
          )
        )}
      </section>
    </div>
  )
}

export default PuntosVentaPage
