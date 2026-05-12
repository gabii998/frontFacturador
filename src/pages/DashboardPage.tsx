import { useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import DashboardCard from '../components/DashboardCard'
import DashboardHeaderPill from '../components/DashboardHeaderPill'
import LoadingContent from '../components/LoadingContent'
import { IconBuildingStore, IconCashRegister, IconFileInvoice } from '@tabler/icons-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)
  const [pvs, setPvs] = useState<PuntoVenta[]>([])
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    AfipService.puntosVenta()
      .then((data) => {
        setPvs(data)
        setSyncedAt(new Date())
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  const displayName = useMemo(() => {
    if (user?.name) return `Hola, ${user.name.split(' ')[0]}!`
    if (user?.email) return `Hola, ${user.email}`
    return 'Resumen de tu operación fiscal'
  }, [user?.name, user?.email])

  const afipServices = useMemo(
    () => {
      const hasError = Boolean(error)
      const tone = hasError ? 'warn' : 'ok'

      return [
        {
          key: 'wsfe',
          label: 'AFIP WSFE',
          status: hasError ? 'Verificar conexión' : 'Operativo',
          tone
        },
        {
          key: 'wsaa',
          label: 'AFIP WSAA',
          status: hasError ? 'Autenticación pendiente' : 'Sesión válida',
          tone
        }
      ]
    },
    [error]
  )

  return (
    <div className="dashboard-layout">
      {error && !loading ? (
        <ErrorBox error={error} />
      ) : (
        <>
          <section className="dashboard-summary">
            <div className="dashboard-summary__content">
              <div>
                <h2 className="dashboard-summary__title">{displayName}</h2>
                <p className="dashboard-summary__subtitle">
                  Estado general de tu operación, accesos principales y sincronización con servicios fiscales.
                </p>
              </div>
              <dl className="dashboard-summary__meta">
                <div>
                  <dt>Panel activo</dt>
                  <dd>{user?.email ?? 'Usuario sin email'}</dd>
                </div>
                <div>
                  <dt>Última sincronización</dt>
                  <dd>{syncedAt ? syncedAt.toLocaleString() : loading ? 'Sincronizando...' : 'Sin datos'}</dd>
                </div>
              </dl>
            </div>
            <div className="dashboard-summary__services">
              {afipServices.map((service) => (
                <DashboardHeaderPill key={service.key} service={service} />
              ))}
            </div>
          </section>

          {loading ? <LoadingContent /> : (
            <section className="dashboard-metrics">
              <DashboardCard
                icon={<IconBuildingStore />}
                section='Puntos de venta visibles'
                title={pvs.length.toString()}
                content='Gestioná las altas, bajas y estados desde el módulo de Puntos de venta.'
                buttonLabel='Revisar listado'
                buttonDestination='puntos-venta'
              />

              <DashboardCard
                icon={<IconCashRegister />}
                section='Emisión rápida'
                title='AFIP WSFE v1'
                content='Ingresá los datos de tu comprobante y emití en segundos con validaciones automáticas.'
                buttonDestination='emitir'
                buttonLabel='Ir a emitir'
              />

              <DashboardCard
                icon={<IconFileInvoice />}
                section='Validaciones & trazabilidad'
                title='En curso'
                content='Consultá comprobantes emitidos, filtros por fecha y descarga en un solo clic.'
                buttonDestination='comprobantes'
                buttonLabel='Ver comprobantes'
              />
            </section>
          )}
        </>
      )}
    </div>
  )
}
