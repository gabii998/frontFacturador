import { Fragment, useEffect, useMemo, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import DashboardCard from '../components/DashboardCard'
import PuntoventaIcon from '../icon/PuntoVentaIcon'
import EmitirIcon from '../icon/EmitirIcon'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import DashboardHeaderPill from '../components/DashboardHeaderPill'
import LoadingContent from '../components/LoadingContent'
import { useAsyncResource } from '../hooks/useAsyncResource'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: pvs, loading, error, success, load } = useAsyncResource<PuntoVenta[]>([])
  const [syncedAt, setSyncedAt] = useState<Date | null>(null)

  useEffect(() => {
    void load(() => AfipService.puntosVenta())
  }, [load])

  useEffect(() => {
    if (success) {
      setSyncedAt(new Date())
    }
  }, [success])

  const displayName = useMemo(() => {
    if (user?.name) return `Hola, ${user.name.split(' ')[0]}!`
    if (user?.email) return `Hola, ${user.email}`
    return 'Resumen de tu operacion fiscal'
  }, [user?.name, user?.email])

  const afipServices = useMemo(() => {
    const hasError = Boolean(error)
    const tone = hasError ? 'warn' : 'ok'

    return [
      {
        key: 'wsfe',
        label: 'AFIP WSFE',
        status: hasError ? 'Verificar conexion' : 'Operativo',
        tone
      },
      {
        key: 'wsaa',
        label: 'AFIP WSAA',
        status: hasError ? 'Autenticacion pendiente' : 'Sesion valida',
        tone
      }
    ]
  }, [error])

  return (
    <div className="dashboard-layout">
      {!loading && error != null && (
        <div className="mt-4">
          <ErrorBox error={error} />
        </div>
      )}

      {!error && (
        <Fragment>
          <section className="dashboard-hero">
            <div className="space-y-4">
              <div>
                <h1 className="dashboard-hero__title">{displayName}</h1>
                <p className="dashboard-hero__subtitle">
                  Seguimiento centralizado de puntos de venta, emision y monitoreo de operaciones. Todo en un mismo lugar para tu equipo.
                </p>
              </div>
              <div className="dashboard-hero__meta">
                <div>
                  <span className="meta-label">Panel activo</span>
                  <span className="meta-value">{user?.email ?? 'Usuario sin email'}</span>
                </div>
                <div>
                  <span className="meta-label">Ultima sincronizacion</span>
                  <span className="meta-value">
                    {syncedAt ? syncedAt.toLocaleString() : loading ? 'Sincronizando...' : 'Sin datos'}
                  </span>
                </div>
              </div>
              <div className="dashboard-hero__services">
                {afipServices.map((service) => (
                  <DashboardHeaderPill key={service.key} service={service} />
                ))}
              </div>
            </div>
          </section>

          {loading && <LoadingContent />}

          {!loading && (
            <Fragment>
              <section className="dashboard-metrics">
                <DashboardCard
                  icon={<PuntoventaIcon />}
                  section='Puntos de venta visibles'
                  title={pvs.length.toString()}
                  content='Gestiona las altas, bajas y estados desde el modulo de Puntos de venta.'
                  buttonLabel='Revisar listado'
                  buttonDestination='puntos-venta'
                />

                <DashboardCard
                  icon={<EmitirIcon />}
                  section='Emision rapida'
                  title='AFIP WSFE v1'
                  content='Ingresa los datos de tu comprobante y emite en segundos con validaciones automaticas.'
                  buttonDestination='emitir'
                  buttonLabel='Ir a emitir'
                />

                <DashboardCard
                  icon={<ComprobanteIcon />}
                  section='Validaciones y trazabilidad'
                  title='En curso'
                  content='Consulta comprobantes emitidos, filtros por fecha y descarga en un solo clic.'
                  buttonDestination='comprobantes'
                  buttonLabel='Ver comprobantes'
                />
              </section>
            </Fragment>
          )}
        </Fragment>
      )}
    </div>
  )
}
