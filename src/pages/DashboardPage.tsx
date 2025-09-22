import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'

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
      if (syncedAt) {
        items.push({
          key: 'synced',
          tone: 'info',
          title: 'Datos refrescados',
          description: `Actualizados hace instantes (${syncedAt.toLocaleTimeString()}).`
        })
      }
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
      <div className="dashboard-alert">
        <div>
          <h3>Bienvenido al panel</h3>
          <p>Mantené tus datos de perfil actualizados y gestioná toda tu operatoria con AFIP desde un solo lugar.</p>
        </div>
        <Link to="/configuracion" className="btn btn-primary">
          Ver mi perfil
        </Link>
      </div>
      <section className="dashboard-hero">
        <div className="dashboard-hero__badge">Panel AFIP</div>
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
              <div key={service.key} className={`service-chip service-chip--${service.tone}`}>
                <span className="service-chip__dot" />
                <div>
                  <span className="service-chip__label">{service.label}</span>
                  <span className="service-chip__status">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-metrics">
        <article className="metric-card">
          <div className="metric-card__icon metric-card__icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </div>
          <header className="metric-card__header">
            <span className="metric-card__label">Puntos de venta visibles</span>
            <strong className="metric-card__value">{loading ? '...' : pvs.length}</strong>
          </header>
          <p className="metric-card__description">Gestioná las altas, bajas y estados desde el módulo de Puntos de venta.</p>
          <Link to="/puntos-venta" className="metric-card__cta">Revisar listado</Link>
        </article>

        <article className="metric-card">
          <div className="metric-card__icon metric-card__icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3v18" />
              <path d="M5 6h14" />
              <path d="M5 12h14" />
              <path d="M5 18h14" />
            </svg>
          </div>
          <header className="metric-card__header">
            <span className="metric-card__label">Emisión rápida</span>
            <strong className="metric-card__value">AFIP WSFE v1</strong>
          </header>
          <p className="metric-card__description">Ingresá los datos de tu comprobante y emití en segundos con validaciones automáticas.</p>
          <Link to="/emitir" className="metric-card__cta">Ir a emitir</Link>
        </article>

        <article className="metric-card">
          <div className="metric-card__icon metric-card__icon--teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4h16v16H4z" />
              <path d="M9 9h6v6H9z" />
              <path d="M9 4v5" />
              <path d="M15 4v5" />
              <path d="M9 15v5" />
              <path d="M15 15v5" />
            </svg>
          </div>
          <header className="metric-card__header">
            <span className="metric-card__label">Validaciones & trazabilidad</span>
            <strong className="metric-card__value">En curso</strong>
          </header>
          <p className="metric-card__description">Consultá comprobantes emitidos, filtros por fecha y descarga en un solo clic.</p>
          <Link to="/comprobantes" className="metric-card__cta">Ver comprobantes</Link>
        </article>
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

      

      <div className="mt-4">
        {loading && <Loader />}
        {!loading && error && <ErrorBox error={error} />}
      </div>

    </div>
  )
}
