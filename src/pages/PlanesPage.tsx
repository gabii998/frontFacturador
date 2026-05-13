import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import ErrorBox from '../components/ErrorBox'
import {
  getPlanName,
  PLAN_DETAILS,
  type PlanCode,
  type PlanDetail
} from '../constants/planes'
import { ensureMercadoPago, MercadoPagoInstance } from '../lib/mercadopago'
import { PaymentsService } from '../services/payments'
import { PlansService, type PlanCatalogItem, type PlanStatusResponse } from '../services/plans'
import { useAuth } from '../contexts/AuthContext'
import { usePrivateTopbarActions } from '../contexts/PrivateTopbarContext'
import { IconAlertCircle, IconCheck, IconClock, IconCreditCard, IconSparkles } from '@tabler/icons-react'

const PlanesPage = () => {
  const { user } = useAuth()
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoInstance | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null)
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null)
  const [plans, setPlans] = useState<PlanDetail[]>(PLAN_DETAILS)
  const [fetchingPlanStatus, setFetchingPlanStatus] = useState(false)
  const [configError, setConfigError] = useState<unknown>(null)
  const [planError, setPlanError] = useState<unknown>(null)
  const [checkoutError, setCheckoutError] = useState<unknown>(null)

  const estadoPlan = planStatus?.status ?? 'ACTIVE'
  const planActivoCode: PlanCode = estadoPlan === 'ACTIVE' ? planStatus?.plan ?? 'free' : 'free'
  const planPendienteCode: PlanCode | null = estadoPlan === 'PENDING' ? planStatus?.plan ?? null : null
  const planActual = getPlanName(planActivoCode)

  useEffect(() => {
    if (!publicKey) {
      setConfigError(new Error('Mercado Pago no está configurado. Revisá la variable VITE_MERCADOPAGO_PUBLIC_KEY.'))
      return
    }

    setConfigError(null)
    let canceled = false

    ensureMercadoPago(publicKey)
      .then((instance) => {
        if (!canceled) {
          setMercadoPago(instance)
        }
      })
      .catch((err) => {
        if (!canceled) {
          setConfigError(err)
        }
      })

    return () => {
      canceled = true
    }
  }, [publicKey])

  const fetchPlanStatus = useCallback(async () => {
    if (!user) {
      setPlanStatus(null)
      setPlanError(null)
      return
    }

    setFetchingPlanStatus(true)
    setPlanError(null)

    try {
      const response = await PlansService.getCurrent(user.id)
      setPlanStatus(response)
    } catch (err) {
      setPlanError(err)
    } finally {
      setFetchingPlanStatus(false)
    }
  }, [user])

  useEffect(() => {
    void fetchPlanStatus()
  }, [fetchPlanStatus])

  useEffect(() => {
    let canceled = false
    PlansService.getCatalog()
      .then((items) => {
        if (!canceled && items.length > 0) {
          setPlans(items.map(mapCatalogItemToPlanDetail))
        }
      })
      .catch((err) => {
        if (!canceled) {
          setPlanError(err)
        }
      })
    return () => {
      canceled = true
    }
  }, [])

  const obtenerMercadoPago = async () => {
    if (!publicKey) {
      throw new Error('Mercado Pago no está configurado. Revisá la variable VITE_MERCADOPAGO_PUBLIC_KEY.')
    }
    if (mercadoPago) {
      return mercadoPago
    }
    const instance = await ensureMercadoPago(publicKey)
    setMercadoPago(instance)
    return instance
  }

  const iniciarPago = async (plan: PlanDetail) => {
    if (!user) {
      setCheckoutError(new Error('Debés iniciar sesión para cambiar de plan.'))
      return
    }

    if (plan.code === planActivoCode || plan.code === planPendienteCode) {
      return
    }

    setCheckoutError(null)
    setLoadingPlan(plan.code)

    try {
      const { preferenceId, initPoint, sandboxInitPoint } = await PaymentsService.createPlanPreference({
        plan: plan.code,
        userId: user.id
      })
      if (!preferenceId) {
        throw new Error('No se pudo generar el pago. Intentalo nuevamente en unos instantes.')
      }

      try {
        const mp = await obtenerMercadoPago()
        mp.checkout({ preference: { id: preferenceId }, autoOpen: true })
      } catch (mpError) {
        const fallbackUrl = initPoint ?? sandboxInitPoint
        if (fallbackUrl) {
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
        } else {
          throw mpError
        }
      }
      await fetchPlanStatus()
    } catch (err) {
      setCheckoutError(err)
    } finally {
      setLoadingPlan(null)
    }
  }

  const error = useMemo(() => configError ?? planError ?? checkoutError, [configError, planError, checkoutError])

  const formattedExpiration = useMemo(() => {
    if (estadoPlan !== 'ACTIVE') return null
    if (!planStatus?.expiresAt) return null
    const date = new Date(planStatus.expiresAt)
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }, [estadoPlan, planStatus?.expiresAt])

  const headerLabel = useMemo(() => {
    if (fetchingPlanStatus) return 'Plan actual: cargando...'
    if (estadoPlan === 'PENDING' && planPendienteCode) {
      return `Plan en proceso: ${getPlanName(planPendienteCode)}`
    }
    return `Plan actual: ${planActual}`
  }, [fetchingPlanStatus, estadoPlan, planPendienteCode, planActual])

  const topbarActions = useMemo(
    () => <span className="plans-topbar-status">{headerLabel}</span>,
    [headerLabel]
  )

  usePrivateTopbarActions(topbarActions)

  return (
    <div className="plans-page">
      {planStatus?.status === 'EXPIRED' && planStatus.previousPlan && (
        <PlanNotice
          tone="warn"
          icon={<IconAlertCircle />}
          message={`Tu plan ${getPlanName(planStatus.previousPlan)} expiró. Pasaste nuevamente al plan Gratuito.`}
        />
      )}

      {planStatus?.status === 'PENDING' && planPendienteCode && (
        <PlanNotice
          tone="info"
          icon={<IconClock />}
          message={`Generamos el checkout de Mercado Pago para el plan ${getPlanName(planPendienteCode)}. Apenas el pago se apruebe, se activará automáticamente.`}
        />
      )}

      {estadoPlan === 'ACTIVE' && formattedExpiration && (
        <PlanNotice
          tone="neutral"
          icon={<IconCreditCard />}
          message={`Renová antes del ${formattedExpiration} para evitar interrupciones.`}
        />
      )}

      <ErrorBox error={error} />

      <div className="plans-grid">
        {plans.map((plan) => {
          const esActual = estadoPlan === 'ACTIVE' && plan.code === planActivoCode
          const esPendiente = estadoPlan === 'PENDING' && planPendienteCode === plan.code
          const estaCargando = loadingPlan === plan.code

          return (
            <PlanCard
              key={plan.code}
              plan={plan}
              active={esActual}
              pending={esPendiente}
              loading={estaCargando}
              onSelect={() => iniciarPago(plan)}
            />
          )
        })}
      </div>
    </div>
  )
}

const planCurrencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

function mapCatalogItemToPlanDetail(plan: PlanCatalogItem): PlanDetail {
  const features = [
    plan.addon ? 'Complemento de comprobantes' : null,
    plan.requiresActiveSubscription ? 'Requiere una suscripción activa' : null,
    plan.invoiceLimit ? `Hasta ${plan.invoiceLimit} comprobantes` : 'Comprobantes ilimitados',
    plan.indefiniteDuration ? 'Duración indefinida' : `Vigencia de ${plan.durationMonths ?? 1} mes(es)`,
    plan.whatsappEmissionEnabled ? 'Emisión por WhatsApp' : 'Sin emisión por WhatsApp',
    plan.bulkEmissionEnabled
      ? plan.bulkEmissionLimit
        ? `Emisión masiva hasta ${plan.bulkEmissionLimit} comprobantes`
        : 'Emisión masiva'
      : 'Sin emisión masiva'
  ].filter(Boolean) as string[]

  return {
    code: plan.code,
    name: plan.title,
    headline: plan.addon ? 'Complemento para tu plan activo' : 'Plan configurable',
    price: planCurrencyFormatter.format(plan.price),
    description: plan.description,
    highlighted: plan.code === 'standard',
    features
  }
}

const PlanNotice = ({
  icon,
  message,
  tone
}: {
  icon: ReactNode
  message: string
  tone: 'neutral' | 'info' | 'warn'
}) => (
  <div className={`plans-notice plans-notice--${tone}`}>
    {icon}
    <span>{message}</span>
  </div>
)

const PlanCard = ({
  plan,
  active,
  pending,
  loading,
  onSelect
}: {
  plan: PlanDetail
  active: boolean
  pending: boolean
  loading: boolean
  onSelect: () => void
}) => {
  const disabled = active || pending || loading
  const buttonLabel = active
    ? 'Plan activo'
    : pending
      ? 'Pago pendiente'
      : loading
        ? 'Generando pago...'
        : 'Elegir plan'

  return (
    <article className={`plans-card ${active ? 'plans-card--active' : ''} ${pending ? 'plans-card--pending' : ''}`}>
      <div className="plans-card__header">
        <div>
          <span>{plan.highlighted ? 'Recomendado' : 'Plan'}</span>
          <h2>{plan.name}</h2>
          <p>{plan.headline}</p>
        </div>
        <div className="plans-card__icon">
          {plan.highlighted ? <IconSparkles /> : <IconCreditCard />}
        </div>
      </div>

      <div className="plans-card__price">
        <strong>{plan.price}</strong>
        <p>{plan.description}</p>
      </div>

      <ul className="plans-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <IconCheck />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`plans-card__button ${active ? 'plans-card__button--active' : ''} ${pending ? 'plans-card__button--pending' : ''}`}
        disabled={disabled}
        onClick={onSelect}
      >
        {buttonLabel}
      </button>
    </article>
  )
}

export default PlanesPage
