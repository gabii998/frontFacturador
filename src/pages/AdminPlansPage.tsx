import { useCallback, useEffect, useState } from 'react'
import ErrorBox from '../components/ErrorBox'
import { PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'
import { AdminPlansService, type AdminPlan } from '../services/adminPlans'
import { IconCircleCheck, IconCircleOff, IconRefresh, IconToggleLeft, IconToggleRight } from '@tabler/icons-react'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

function formatAmount(value: number) {
  return currencyFormatter.format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [updatingPlan, setUpdatingPlan] = useState<PlanCode | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState<string | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPlans(await AdminPlansService.list())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlans()
  }, [loadPlans])

  const togglePlan = async (plan: AdminPlan) => {
    setUpdatingPlan(plan.code)
    setError(null)
    setMessage(null)
    try {
      const updated = await AdminPlansService.update(plan.code, !plan.enabled)
      setPlans((current) => current.map((item) => item.code === updated.code ? updated : item))
      setMessage(`${PLAN_CODE_TO_NAME[updated.code]} ${updated.enabled ? 'dado de alta' : 'dado de baja'}.`)
    } catch (err) {
      setError(err)
    } finally {
      setUpdatingPlan(null)
    }
  }

  const enabledCount = plans.filter((plan) => plan.enabled).length
  const disabledCount = plans.length - enabledCount

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Planes</h2>
            <p>Alta y baja de los planes disponibles para contratación.</p>
          </div>
          <button type="button" className="ops-icon-button" onClick={() => void loadPlans()} disabled={loading}>
            <IconRefresh className={loading ? 'animate-spin' : undefined} />
            <span>{loading ? 'Actualizando' : 'Actualizar'}</span>
          </button>
        </div>

        <ErrorBox error={error} />
        {message && <div className="ops-action-message">{message}</div>}

        <div className="ops-stats-grid admin-plans-stats">
          <div className="ops-stat-card">
            <span>Planes</span>
            <strong>{plans.length || '-'}</strong>
          </div>
          <div className="ops-stat-card ops-stat-card--ok">
            <span>Activos</span>
            <strong>{enabledCount}</strong>
          </div>
          <div className="ops-stat-card ops-stat-card--warn">
            <span>Inactivos</span>
            <strong>{disabledCount}</strong>
          </div>
        </div>

        <div className="mail-list-section">
          <div className="ops-table-section__header">
            <p>Catálogo de planes</p>
          </div>

          <div className="mail-list">
            {plans.map((plan) => {
              const updating = updatingPlan === plan.code
              return (
                <article key={plan.code} className={`mail-card admin-plan-card ${!plan.enabled ? 'admin-plan-card--disabled' : ''}`}>
                  <div className="mail-card__icon admin-plan-card__icon">
                    {plan.enabled ? <IconCircleCheck /> : <IconCircleOff />}
                  </div>

                  <div className="mail-card__content">
                    <div className="mail-card__main">
                      <div className="mail-card__title">
                        <strong>{PLAN_CODE_TO_NAME[plan.code]}</strong>
                        <span>{plan.description}</span>
                      </div>
                      <div className="mail-card__pills">
                        <span className={`admin-plan-pill ${plan.enabled ? 'admin-plan-pill--enabled' : 'admin-plan-pill--disabled'}`}>
                          {plan.enabled ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="admin-plan-pill admin-plan-pill--price">
                          {formatAmount(plan.price)}
                        </span>
                      </div>
                    </div>

                    <div className="admin-plan-card__meta">
                      <div className="mail-card__meta">
                        <span>Código</span>
                        <strong>{plan.code}</strong>
                      </div>
                      <div className="mail-card__meta">
                        <span>Último cambio</span>
                        <strong>{formatDateTime(plan.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`mail-card__action admin-plan-card__action ${plan.enabled ? 'admin-plan-card__action--danger' : 'admin-plan-card__action--primary'}`}
                    disabled={updating}
                    onClick={() => void togglePlan(plan)}
                  >
                    {plan.enabled ? <IconToggleRight /> : <IconToggleLeft />}
                    <span>{updating ? 'Actualizando' : plan.enabled ? 'Dar de baja' : 'Dar de alta'}</span>
                  </button>
                </article>
              )
            })}

            {!loading && plans.length === 0 && (
              <div className="mail-list__empty">
                No hay planes para mostrar.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
