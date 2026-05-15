import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import EmptyContent from '../components/EmptyContent'
import ErrorBox from '../components/ErrorBox'
import LoadingContent from '../components/LoadingContent'
import { getPlanName, type PlanCode } from '../constants/planes'
import { AdminPlansService, type AdminPlan, type CreateAdminPlanPayload, type UpdateAdminPlanPayload } from '../services/adminPlans'
import { IconBrandWhatsapp, IconCalendarTime, IconCheck, IconCreditCard, IconFileInvoice, IconFiles, IconInfoCircle, IconPlus, IconSparkles, IconToggleLeft, IconToggleRight, IconX } from '@tabler/icons-react'
import { usePrivateTopbarActions } from '../contexts/PrivateTopbarContext'
type PlanFilter = 'total' | 'active' | 'inactive'

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

function formatAmount(value: number) {
  return currencyFormatter.format(value)
}

function buildPlanPreviewFeatures(plan: AdminPlan) {
  return [
    plan.addon ? 'Complemento de comprobantes' : 'Plan base',
    plan.requiresActiveSubscription ? 'Requiere suscripción activa' : null,
    plan.invoiceLimit ? `Hasta ${plan.invoiceLimit} comprobantes mensuales` : 'Comprobantes ilimitados',
    plan.indefiniteDuration ? 'Duración indefinida' : `Duración de ${plan.durationMonths ?? 1} mes(es)`,
    plan.whatsappEmissionEnabled ? 'Emisión por WhatsApp incluida' : 'Sin emisión por WhatsApp',
    plan.bulkEmissionEnabled
      ? plan.bulkEmissionLimit
        ? `Emisión masiva hasta ${plan.bulkEmissionLimit} comprobantes por carga`
        : 'Emisión masiva incluida'
      : 'Sin emisión masiva'
  ].filter(Boolean) as string[]
}

function buildAdminPlanSummary(plan: AdminPlan) {
  if (plan.addon) {
    const credits = plan.invoiceLimit ? `${plan.invoiceLimit} comprobantes adicionales` : 'comprobantes adicionales'
    return `Suma ${credits}; requiere base activa.`
  }
  const limit = plan.invoiceLimit ? `${plan.invoiceLimit} comprobantes mensuales` : 'comprobantes ilimitados'
  const duration = plan.indefiniteDuration ? 'duración indefinida' : `vigencia de ${plan.durationMonths ?? 1} mes(es)`
  return `Base con ${limit} y ${duration}.`
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([])
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(false)
  const [updatingPlan, setUpdatingPlan] = useState<PlanCode | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  const [creatingPlan, setCreatingPlan] = useState(false)
  const [activeTab, setActiveTab] = useState<'catalog' | 'preview'>('catalog')
  const [statusFilter, setStatusFilter] = useState<PlanFilter>('total')

  const loadPlans = useCallback(async (estado: PlanFilter = statusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const response = await AdminPlansService.list(estado)
      const items = Array.isArray(response)
        ? response
        : Array.isArray(response.items)
          ? response.items
          : []

      setPlans(items)
      setCounts({
        total: Array.isArray(response) ? items.length : response.totalCount ?? items.length,
        active: Array.isArray(response) ? items.filter((plan) => plan.enabled).length : response.activeCount ?? 0,
        inactive: Array.isArray(response) ? items.filter((plan) => !plan.enabled).length : response.inactiveCount ?? 0
      })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadPlans(statusFilter)
  }, [loadPlans, statusFilter])

  const savePlanSettings = async (plan: AdminPlan, payload: UpdateAdminPlanPayload) => {
    setUpdatingPlan(plan.code)
    setError(null)
    setMessage(null)
    try {
      const updated = await AdminPlansService.update(plan.code, payload)
      setEditingPlan(null)
      setMessage(`${updated.title || getPlanName(updated.code)} actualizado.`)
      await loadPlans(statusFilter)
    } catch (err) {
      setError(err)
    } finally {
      setUpdatingPlan(null)
    }
  }

  const createPlan = async (payload: CreateAdminPlanPayload) => {
    setUpdatingPlan(payload.code)
    setError(null)
    setMessage(null)
    try {
      const created = await AdminPlansService.create(payload)
      setCreatingPlan(false)
      setEditingPlan(created)
      setActiveTab('catalog')
      setMessage(`${created.title || getPlanName(created.code)} creado.`)
      await loadPlans(statusFilter)
    } catch (err) {
      setError(err)
    } finally {
      setUpdatingPlan(null)
    }
  }

  const topbarActions = useMemo(
    () => (
      <button type="button" className="ops-icon-button" onClick={() => setCreatingPlan(true)}>
        <IconPlus />
        <span>Nuevo plan</span>
      </button>
    ),
    []
  )

  usePrivateTopbarActions(topbarActions)

  return (
    <div className="ops-page">
      <section className="ops-panel">
        <div className="ops-panel__header">
          <div>
            <h2>Planes</h2>
            <p>Alta y baja de los planes disponibles para contratación.</p>
          </div>
          <div className="notifications-page__header-stats">
            <button
              type="button"
              className={`notifications-page__header-pill ${statusFilter === 'total' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('total')}
            >
              <span>Planes</span>
              <strong>{counts.total}</strong>
            </button>
            <button
              type="button"
              className={`notifications-page__header-pill ${statusFilter === 'active' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              <span>Activos</span>
              <strong>{counts.active}</strong>
            </button>
            <button
              type="button"
              className={`notifications-page__header-pill ${statusFilter === 'inactive' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              <span>Inactivos</span>
              <strong>{counts.inactive}</strong>
            </button>
          </div>
        </div>

        <ErrorBox error={error} />
        {message && <div className="ops-action-message">{message}</div>}
        {loading && plans.length === 0 && <LoadingContent />}

        <div className="ops-tabs" role="tablist" aria-label="Vista de planes">
          <button
            type="button"
            className={activeTab === 'catalog' ? 'is-active' : undefined}
            role="tab"
            aria-selected={activeTab === 'catalog'}
            onClick={() => setActiveTab('catalog')}
          >
            Catálogo
          </button>
          <button
            type="button"
            className={activeTab === 'preview' ? 'is-active' : undefined}
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>

        {activeTab === 'catalog' && !loading && (
          <div className="mail-list-section" role="tabpanel">
          <div className="ops-table-section__header">
            <p>{plansTitle(statusFilter)}</p>
          </div>

          <div className="mail-list">
            {plans.map((plan) => {
              return (
                <article
                  key={plan.code}
                  className={`mail-card admin-plan-card ${!plan.enabled ? 'admin-plan-card--disabled' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingPlan(plan)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setEditingPlan(plan)
                    }
                  }}
                >
                  <div className="mail-card__content">
                    <div className="mail-card__main">
                      <div className="mail-card__title">
                        <strong>{plan.title || getPlanName(plan.code)}</strong>
                        <small>{buildAdminPlanSummary(plan)}</small>
                      </div>
                      <div className="mail-card__pills">
                        <span className={`admin-plan-pill ${plan.enabled ? 'admin-plan-pill--enabled' : 'admin-plan-pill--disabled'}`}>
                          {plan.enabled ? 'Activo' : 'Inactivo'}
                        </span>
                        {plan.addon && (
                          <span className="admin-plan-pill admin-plan-pill--addon">
                            Complemento
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-plan-card__meta">
                      <PlanMetric
                        icon={<IconFileInvoice />}
                        label={plan.addon ? 'Crédito' : 'Comprobantes'}
                        value={plan.invoiceLimit ? `${plan.invoiceLimit}` : '∞'}
                        detail={plan.addon ? 'extra' : plan.invoiceLimit ? 'mensuales' : 'sin límite'}
                      />
                      <PlanMetric
                        icon={<IconCalendarTime />}
                        label="Duración"
                        value={plan.indefiniteDuration ? '∞' : `${plan.durationMonths ?? 1}`}
                        detail={plan.indefiniteDuration ? 'no vence' : 'mes(es)'}
                      />
                      <FeatureIndicator icon={<IconBrandWhatsapp />} label="WhatsApp" enabled={plan.whatsappEmissionEnabled} />
                      <FeatureIndicator
                        icon={<IconFiles />}
                        label="Emisión masiva"
                        enabled={plan.bulkEmissionEnabled}
                        detail={plan.bulkEmissionEnabled && plan.bulkEmissionLimit ? `${plan.bulkEmissionLimit} por carga` : undefined}
                      />
                      {plan.addon && <FeatureIndicator label="Requiere base" enabled={plan.requiresActiveSubscription} />}
                    </div>
                  </div>
                  <div className="admin-plan-card__amount">
                    <span>Precio</span>
                    <strong>{formatAmount(plan.price)}</strong>
                  </div>
                </article>
              )
            })}

            {!loading && !error && plans.length === 0 && (
              <EmptyContent
                title={plansEmptyTitle(statusFilter)}
                subtitle={plansEmptySubtitle(statusFilter)}
                icon={<IconInfoCircle />}
              />
            )}
          </div>
          </div>
        )}

        {activeTab === 'preview' && plans.length > 0 && (
          <div className="admin-plans-preview" role="tabpanel">
            <div className="ops-table-section__header">
              <p>Preview para usuario</p>
            </div>
            <div className="admin-plans-preview__grid">
              {plans.map((plan) => (
                <AdminPlanPreviewCard key={plan.code} plan={plan} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && !loading && !error && plans.length === 0 && (
          <div role="tabpanel">
            <EmptyContent
              title="No hay planes para previsualizar"
              subtitle="Cuando existan planes en el catálogo, vas a poder revisarlos en esta vista previa."
              icon={<IconInfoCircle />}
            />
          </div>
        )}
      </section>

      {editingPlan && createPortal(
        <PlanSettingsModal
          plan={editingPlan}
          saving={updatingPlan === editingPlan.code}
          onClose={() => setEditingPlan(null)}
          onSave={(payload) => void savePlanSettings(editingPlan, payload)}
        />,
        document.body
      )}

      {creatingPlan && createPortal(
        <CreatePlanModal
          saving={updatingPlan !== null}
          onClose={() => setCreatingPlan(false)}
          onSave={(payload) => void createPlan(payload)}
        />,
        document.body
      )}
    </div>
  )
}

function plansTitle(statusFilter: PlanFilter) {
  switch (statusFilter) {
    case 'active':
      return 'Planes activos'
    case 'inactive':
      return 'Planes inactivos'
    default:
      return 'Catálogo de planes'
  }
}

function plansEmptyTitle(statusFilter: PlanFilter) {
  switch (statusFilter) {
    case 'active':
      return 'No hay planes activos para mostrar'
    case 'inactive':
      return 'No hay planes inactivos para mostrar'
    default:
      return 'No hay planes para mostrar'
  }
}

function plansEmptySubtitle(statusFilter: PlanFilter) {
  switch (statusFilter) {
    case 'active':
      return 'Los planes habilitados para contratación aparecerán en esta vista.'
    case 'inactive':
      return 'Los planes deshabilitados aparecerán acá para administración interna.'
    default:
      return 'Cuando exista catálogo administrable, los planes aparecerán listados en esta sección.'
  }
}

const FeatureIndicator = ({
  icon,
  label,
  enabled,
  detail
}: {
  icon?: ReactNode
  label: string
  enabled: boolean
  detail?: string
}) => (
  <div className={`admin-plan-feature ${enabled ? 'admin-plan-feature--enabled' : 'admin-plan-feature--disabled'}`}>
    <span>
      {icon}
      {label}
    </span>
    <strong>
      {enabled ? <IconCheck /> : <IconX />}
      {detail && <small>{detail}</small>}
    </strong>
  </div>
)

const PlanMetric = ({
  icon,
  label,
  value,
  detail
}: {
  icon: ReactNode
  label: string
  value: string
  detail: string
}) => (
  <div className="admin-plan-metric">
    <span>
      {icon}
      {label}
    </span>
    <strong>
      <b>{value}</b>
      <small>{detail}</small>
    </strong>
  </div>
)

const AdminPlanPreviewCard = ({ plan }: { plan: AdminPlan }) => {
  const highlighted = plan.code === 'standard'
  return (
    <article className={`plans-card admin-plan-preview-card ${highlighted ? 'plans-card--active' : ''} ${!plan.enabled ? 'admin-plan-preview-card--disabled' : ''}`}>
      <div className="plans-card__header">
        <div>
          <span>{highlighted ? 'Recomendado' : plan.enabled ? 'Plan' : 'No disponible'}</span>
          <h2>{plan.title || getPlanName(plan.code)}</h2>
        </div>
        <div className="plans-card__icon">
          {highlighted ? <IconSparkles /> : <IconCreditCard />}
        </div>
      </div>

      <div className="plans-card__price">
        <strong>{formatAmount(plan.price)}</strong>
        <p>{plan.indefiniteDuration ? 'Sin vencimiento automático' : `Vigencia: ${plan.durationMonths ?? 1} mes(es)`}</p>
      </div>

      <ul className="plans-card__features">
        {buildPlanPreviewFeatures(plan).map((feature) => (
          <li key={feature}>
            <IconCheck />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button type="button" className="plans-card__button" disabled={!plan.enabled}>
        {plan.enabled ? 'Elegir plan' : 'No disponible'}
      </button>
    </article>
  )
}

const PlanSettingsModal = ({
  plan,
  saving,
  onClose,
  onSave
}: {
  plan: AdminPlan
  saving: boolean
  onClose: () => void
  onSave: (payload: UpdateAdminPlanPayload) => void
}) => {
  const [enabled] = useState(plan.enabled)
  const [invoiceLimitEnabled, setInvoiceLimitEnabled] = useState(typeof plan.invoiceLimit === 'number')
  const [invoiceLimit, setInvoiceLimit] = useState(plan.invoiceLimit?.toString() ?? '')
  const [indefiniteDuration, setIndefiniteDuration] = useState(plan.indefiniteDuration)
  const [durationMonths, setDurationMonths] = useState(plan.durationMonths?.toString() ?? '1')
  const [whatsappEmissionEnabled, setWhatsappEmissionEnabled] = useState(plan.whatsappEmissionEnabled)
  const [bulkEmissionEnabled, setBulkEmissionEnabled] = useState(plan.bulkEmissionEnabled)
  const [bulkLimitEnabled, setBulkLimitEnabled] = useState(typeof plan.bulkEmissionLimit === 'number')
  const [bulkEmissionLimit, setBulkEmissionLimit] = useState(plan.bulkEmissionLimit?.toString() ?? '')
  const [addon, setAddon] = useState(plan.addon)
  const [title, setTitle] = useState(plan.title)
  const [description, setDescription] = useState(plan.description)
  const [price, setPrice] = useState(plan.price.toString())

  const buildPayload = (nextEnabled = enabled): UpdateAdminPlanPayload => {
    const parsedInvoiceLimit = Number.parseInt(invoiceLimit, 10)
    const parsedDuration = Number.parseInt(durationMonths, 10)
    const parsedBulkLimit = Number.parseInt(bulkEmissionLimit, 10)
    return {
      title: title.trim(),
      description: description.trim(),
      price: Number.parseFloat(price) || 0,
      enabled: nextEnabled,
      invoiceLimit: invoiceLimitEnabled && Number.isFinite(parsedInvoiceLimit) ? parsedInvoiceLimit : null,
      indefiniteDuration,
      durationMonths: indefiniteDuration ? null : Number.isFinite(parsedDuration) ? parsedDuration : 1,
      whatsappEmissionEnabled,
      bulkEmissionEnabled,
      bulkEmissionLimit: bulkLimitEnabled && Number.isFinite(parsedBulkLimit) ? parsedBulkLimit : null,
      addon,
      requiresActiveSubscription: addon
    }
  }

  const handleSave = () => {
    onSave(buildPayload())
  }

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="admin-plan-settings-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel admin-plan-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="admin-plan-settings-title" className="auth-modal__title">Configurar plan</h1>
            <p className="mt-1 text-sm text-slate-500">{plan.code}</p>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar modal" onClick={onClose}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="admin-plan-modal__body">
          <label className="admin-user-control">
            <span>Nombre visible</span>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="admin-user-control">
            <span>Descripción</span>
            <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <label className="admin-user-control">
            <span>Precio</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={addon} onChange={(event) => setAddon(event.target.checked)} />
            <span>Es complemento de otro plan</span>
          </label>

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={invoiceLimitEnabled} onChange={(event) => setInvoiceLimitEnabled(event.target.checked)} />
            <span>Limitar comprobantes mensuales</span>
          </label>

          {invoiceLimitEnabled && (
            <label className="admin-user-control">
              <span>Cantidad mensual</span>
              <input
                type="number"
                min={1}
                className="input"
                value={invoiceLimit}
                onChange={(event) => setInvoiceLimit(event.target.value)}
              />
            </label>
          )}

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={addon || indefiniteDuration} disabled={addon} onChange={(event) => setIndefiniteDuration(event.target.checked)} />
            <span>Duración indefinida</span>
          </label>

          {!addon && !indefiniteDuration && (
            <label className="admin-user-control">
              <span>Duración por defecto en meses</span>
              <input
                type="number"
                min={1}
                className="input"
                value={durationMonths}
                onChange={(event) => setDurationMonths(event.target.value)}
              />
            </label>
          )}

          <label className="admin-plan-toggle">
            <input
              type="checkbox"
              checked={whatsappEmissionEnabled}
              onChange={(event) => setWhatsappEmissionEnabled(event.target.checked)}
            />
            <span>Permitir emisión por WhatsApp</span>
          </label>

          <label className="admin-plan-toggle">
            <input
              type="checkbox"
              checked={bulkEmissionEnabled}
              onChange={(event) => setBulkEmissionEnabled(event.target.checked)}
            />
            <span>Permitir emisión masiva</span>
          </label>

          {bulkEmissionEnabled && (
            <>
              <label className="admin-plan-toggle">
                <input
                  type="checkbox"
                  checked={bulkLimitEnabled}
                  onChange={(event) => setBulkLimitEnabled(event.target.checked)}
                />
                <span>Limitar comprobantes por carga masiva</span>
              </label>

              {bulkLimitEnabled && (
                <label className="admin-user-control">
                  <span>Cantidad por carga</span>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={bulkEmissionLimit}
                    onChange={(event) => setBulkEmissionLimit(event.target.value)}
                  />
                </label>
              )}
            </>
          )}

          <div className="admin-user-modal__actions">
            <button
              type="button"
              className={`admin-plan-modal__status-action ${enabled ? 'admin-plan-modal__status-action--danger' : 'admin-plan-modal__status-action--primary'}`}
              onClick={() => onSave(buildPayload(!enabled))}
              disabled={saving}
            >
              {enabled ? <IconToggleRight /> : <IconToggleLeft />}
              <span>{enabled ? 'Dar de baja' : 'Dar de alta'}</span>
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando' : 'Guardar configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CreatePlanModal = ({
  saving,
  onClose,
  onSave
}: {
  saving: boolean
  onClose: () => void
  onSave: (payload: CreateAdminPlanPayload) => void
}) => {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [addon, setAddon] = useState(false)
  const [invoiceLimit, setInvoiceLimit] = useState('')
  const [durationMonths, setDurationMonths] = useState('1')
  const [indefiniteDuration, setIndefiniteDuration] = useState(false)
  const [whatsappEmissionEnabled, setWhatsappEmissionEnabled] = useState(true)
  const [bulkEmissionEnabled, setBulkEmissionEnabled] = useState(true)
  const [bulkEmissionLimit, setBulkEmissionLimit] = useState('')

  const handleSubmit = () => {
    const parsedInvoiceLimit = Number.parseInt(invoiceLimit, 10)
    const parsedDuration = Number.parseInt(durationMonths, 10)
    const parsedBulkLimit = Number.parseInt(bulkEmissionLimit, 10)
    onSave({
      code,
      title,
      description,
      price: Number.parseFloat(price) || 0,
      invoiceLimit: Number.isFinite(parsedInvoiceLimit) ? parsedInvoiceLimit : null,
      indefiniteDuration: addon || indefiniteDuration,
      durationMonths: addon || indefiniteDuration ? null : Number.isFinite(parsedDuration) ? parsedDuration : 1,
      whatsappEmissionEnabled,
      bulkEmissionEnabled,
      bulkEmissionLimit: Number.isFinite(parsedBulkLimit) ? parsedBulkLimit : null,
      addon,
      requiresActiveSubscription: addon
    })
  }

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="create-plan-title">
      <button type="button" className="auth-modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="auth-modal__panel admin-plan-modal" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal__header">
          <div>
            <h1 id="create-plan-title" className="auth-modal__title">Nuevo plan</h1>
            <p className="mt-1 text-sm text-slate-500">Alta de catálogo configurable.</p>
          </div>
          <button type="button" className="auth-modal__close" aria-label="Cerrar modal" onClick={onClose}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          </button>
        </div>

        <div className="admin-plan-modal__body">
          <label className="admin-user-control">
            <span>Código</span>
            <input className="input" placeholder="ej: extra-10" value={code} onChange={(event) => setCode(event.target.value)} />
          </label>

          <label className="admin-user-control">
            <span>Nombre visible</span>
            <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="admin-user-control">
            <span>Descripción</span>
            <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <label className="admin-user-control">
            <span>Precio</span>
            <input type="number" min={0} step="0.01" className="input" value={price} onChange={(event) => setPrice(event.target.value)} />
          </label>

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={addon} onChange={(event) => setAddon(event.target.checked)} />
            <span>Es complemento de otro plan</span>
          </label>

          <label className="admin-user-control">
            <span>{addon ? 'Comprobantes adicionales' : 'Límite de comprobantes mensual'}</span>
            <input
              type="number"
              min={1}
              className="input"
              placeholder="Sin límite"
              value={invoiceLimit}
              onChange={(event) => setInvoiceLimit(event.target.value)}
            />
          </label>

          {!addon && (
            <label className="admin-plan-toggle">
              <input type="checkbox" checked={indefiniteDuration} onChange={(event) => setIndefiniteDuration(event.target.checked)} />
              <span>Duración indefinida</span>
            </label>
          )}

          {!addon && !indefiniteDuration && (
            <label className="admin-user-control">
              <span>Duración por defecto en meses</span>
              <input type="number" min={1} className="input" value={durationMonths} onChange={(event) => setDurationMonths(event.target.value)} />
            </label>
          )}

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={whatsappEmissionEnabled} onChange={(event) => setWhatsappEmissionEnabled(event.target.checked)} />
            <span>Permitir emisión por WhatsApp</span>
          </label>

          <label className="admin-plan-toggle">
            <input type="checkbox" checked={bulkEmissionEnabled} onChange={(event) => setBulkEmissionEnabled(event.target.checked)} />
            <span>Permitir emisión masiva</span>
          </label>

          {bulkEmissionEnabled && (
            <label className="admin-user-control">
              <span>Límite por carga masiva</span>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Sin límite"
                value={bulkEmissionLimit}
                onChange={(event) => setBulkEmissionLimit(event.target.value)}
              />
            </label>
          )}

          <div className="admin-user-modal__actions">
            <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving || !code.trim() || !title.trim()}>
              {saving ? 'Creando' : 'Crear plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
