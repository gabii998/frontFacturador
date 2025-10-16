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

  const insights = useMemo(() => {
    const items: Array<{ key: string, tone: 'ok' | 'info' | 'warn', title: string, description: string }> = []
    if (loading) {
      items.push({
        key: 'syncing',
        tone: 'info',
        title: 'Sincronizando datos',
        description: 'Consultando AFIP para obtener información actualizada.'
      })
    } else if (error) {
      items.push({
        key: 'error',
        tone: 'warn',
        title: 'Atención requerida',
        description: 'No pudimos recuperar la información. Intenta nuevamente más tarde.'
      })
    } else {
      items.push({
        key: 'pvs',
        tone: 'ok',
        title: `${pvs.length} puntos de venta visibles`,
        description: 'Listos para emitir comprobantes o consultar movimientos.'
      })
    }
    return items
  }, [loading, error, pvs.length, syncedAt])

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

      <div className="mt-4">
        {loading && <LoadingContent />}
        {!loading && <ErrorBox error={error} />}
      </div>

      {error != '' && error != "" && <Fragment>
        <section className="dashboard-hero">
          <div className="space-y-4">
            <div>
              <h1 className="dashboard-hero__title">{displayName}</h1>
              <p className="dashboard-hero__subtitle">
                Seguimiento centralizado de puntos de venta, emisión y monitoreo de operaciones. Todo en un mismo lugar para tu equipo.
              </p>
            </div>
            <div className="dashboard-hero__meta">
              <div>
                <span className="meta-label">Panel activo</span>
                <span className="meta-value">{user?.email ?? 'Usuario sin email'}</span>
              </div>
              <div>
                <span className="meta-label">Última sincronización</span>
                <span className="meta-value">
                  {syncedAt ? syncedAt.toLocaleString() : loading ? 'Sincronizando...' : 'Sin datos'}
                </span>
              </div>
            </div>
            <div className="dashboard-hero__services">
              {afipServices.map((service) => (
                <DashboardHeaderPill service={service} />
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-metrics">
          <DashboardCard
            icon={<PuntoventaIcon />}
            section='Puntos de venta visibles'
            title={loading ? '...' : pvs.length.toString()}
            content='Gestioná las altas, bajas y estados desde el módulo de Puntos de venta.'
            buttonLabel='Revisar listado'
            buttonDestination='puntos-venta'
          />

          <DashboardCard
            icon={<EmitirIcon />}
            section='Emisión rápida'
            title='AFIP WSFE v1'
            content='Ingresá los datos de tu comprobante y emití en segundos con validaciones automáticas.'
            buttonDestination='emitir'
            buttonLabel='Ir a emitir'
          />

          <DashboardCard
            icon={<ComprobanteIcon />}
            section='Validaciones & trazabilidad'
            title='En curso'
            content='Consultá comprobantes emitidos, filtros por fecha y descarga en un solo clic.'
            buttonDestination='comprobantes'
            buttonLabel='Ver comprobantes'
          />
        </section>

        <section className="dashboard-secondary">
          <div className="dashboard-card">
            <header className="dashboard-card__header">
              <div>
                <h2 className="dashboard-card__title">Actividad reciente</h2>
                <p className="dashboard-card__subtitle">Estado general de la operación según la última actualización.</p>
              </div>
            </header>
            <div className="insights-list">
              {insights.map((item) => (
                <div key={item.key} className="insight-item">
                  <span className={`insight-dot insight-dot--${item.tone}`} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </Fragment>}



    </div>
  )
}
