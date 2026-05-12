import { IconBuildingStore, IconCircleCheck, IconCircleX, IconLock, IconLockOpen } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import type { PuntoVenta } from '../models/afip'

export default function PuntosVentaTable({ data }: { data: PuntoVenta[] }) {
  const activos = data.filter((pv) => !pv.bloqueado && !pv.fchBaja).length
  const bloqueados = data.filter((pv) => pv.bloqueado).length
  const dadosDeBaja = data.filter((pv) => pv.fchBaja).length

  return (
    <section className="puntos-venta-list">
      <header className="puntos-venta-list__header">
        <div>
          <h2 className="puntos-venta-list__title">Puntos de venta</h2>
          <p className="puntos-venta-list__subtitle">
            Estado de los puntos habilitados para emitir comprobantes.
          </p>
        </div>
        <div className="puntos-venta-list__summary">
          <StatusCounter label="Activos" value={activos} tone="ok" />
          <StatusCounter label="Bloqueados" value={bloqueados} tone="warn" />
          <StatusCounter label="Baja" value={dadosDeBaja} tone="muted" />
        </div>
      </header>

      <div className="puntos-venta-list__grid">
        {data.map((pv) => {
          const isInactive = Boolean(pv.fchBaja)
          const isBlocked = pv.bloqueado
          const status = isInactive ? 'Baja' : isBlocked ? 'Bloqueado' : 'Activo'
          const statusClass = isInactive
            ? 'punto-venta-card__status--muted'
            : isBlocked
              ? 'punto-venta-card__status--warn'
              : 'punto-venta-card__status--ok'

          return (
            <article key={pv.nro} className="punto-venta-card">
              <div className="punto-venta-card__icon" aria-hidden="true">
                <IconBuildingStore />
              </div>
              <div className="punto-venta-card__body">
                <div className="punto-venta-card__main">
                  <div>
                    <span className="punto-venta-card__label">Punto de venta</span>
                    <strong className="punto-venta-card__number">{String(pv.nro).padStart(4, '0')}</strong>
                  </div>
                  <span className={`punto-venta-card__status ${statusClass}`}>
                    {isInactive ? <IconCircleX /> : isBlocked ? <IconLock /> : <IconCircleCheck />}
                    {status}
                  </span>
                </div>

                <div className="punto-venta-card__details">
                  <DetailItem label="Emisión" value={pv.emisionTipo} />
                  <DetailItem
                    label="Bloqueo"
                    value={isBlocked ? 'No disponible' : 'Disponible'}
                    icon={isBlocked ? <IconLock /> : <IconLockOpen />}
                  />
                  <DetailItem label="Fecha de baja" value={pv.fchBaja ?? '-'} />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const StatusCounter = ({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'muted' }) => {
  return (
    <div className={`puntos-venta-counter puntos-venta-counter--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const DetailItem = ({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) => {
  return (
    <div className="punto-venta-card__detail">
      <span>{label}</span>
      <strong>
        {icon}
        {value}
      </strong>
    </div>
  )
}
