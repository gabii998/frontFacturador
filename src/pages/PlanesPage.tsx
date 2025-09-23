import { useCallback, useEffect, useMemo, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import HeaderPill from '../components/HeaderPill'
import ErrorBox from '../components/ErrorBox'
import PlanesIcon from '../icon/PlanesIcon'
import {
  PLAN_COLORS,
  PLAN_COLORS_BY_CODE,
  PLAN_CODE_TO_NAME,
  PLAN_DETAILS,
  type PlanCode,
  type PlanDetail,
  type PlanName
} from '../constants/planes'
import { ensureMercadoPago, MercadoPagoInstance } from '../lib/mercadopago'
import { PaymentsService } from '../services/payments'
import { PlansService, type PlanStatusResponse } from '../services/plans'
import { useAuth } from '../contexts/AuthContext'

const PlanesPage = () => {
  const { user } = useAuth()
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoInstance | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null)
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null)
  const [fetchingPlanStatus, setFetchingPlanStatus] = useState(false)
  const [configError, setConfigError] = useState<unknown>(null)
  const [planError, setPlanError] = useState<unknown>(null)
  const [checkoutError, setCheckoutError] = useState<unknown>(null)

  const estadoPlan = planStatus?.status ?? 'ACTIVE'
  const planActivoCode: PlanCode = estadoPlan === 'ACTIVE' ? planStatus?.plan ?? 'free' : 'free'
  const planPendienteCode: PlanCode | null = estadoPlan === 'PENDING' ? planStatus?.plan ?? null : null
  const planActual: PlanName = PLAN_CODE_TO_NAME[planActivoCode]

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
      return `Plan en proceso: ${PLAN_CODE_TO_NAME[planPendienteCode]}`
    }
    return `Plan actual: ${planActual}`
  }, [fetchingPlanStatus, estadoPlan, planPendienteCode, planActual])

  const headerDotColor = estadoPlan === 'PENDING' && planPendienteCode
    ? 'bg-amber-500'
    : PLAN_COLORS_BY_CODE[planActivoCode]

  return (
    <div className="space-y-6">
      <SectionHeader
        section="Planes"
        icon={<PlanesIcon />}
        title="Compará y elegí el plan ideal"
        subtitle="Encontrá la opción que mejor se adapta a tu negocio y escalá tu facturación sin obstáculos."
        rightContent={<HeaderPill label={headerLabel} dotColor={headerDotColor} />}
      />

      {planStatus?.status === 'EXPIRED' && planStatus.previousPlan && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu plan {PLAN_CODE_TO_NAME[planStatus.previousPlan]} expiró. Pasaste nuevamente al plan Gratuito.
        </div>
      )}

      {planStatus?.status === 'PENDING' && planPendienteCode && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Generamos el checkout de Mercado Pago para el plan {PLAN_CODE_TO_NAME[planPendienteCode]}. Apenas el pago se apruebe, se activará automáticamente.
        </div>
      )}

      {estadoPlan === 'ACTIVE' && formattedExpiration && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Renová antes del <span className="font-semibold text-slate-800">{formattedExpiration}</span> para evitar interrupciones.
        </div>
      )}

      <ErrorBox error={error} />

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_DETAILS.map((plan) => {
          const esActual = estadoPlan === 'ACTIVE' && plan.code === planActivoCode
          const esPendiente = estadoPlan === 'PENDING' && planPendienteCode === plan.code
          const estaCargando = loadingPlan === plan.code

          return (
            <article
              key={plan.name}
              className={`card flex h-full flex-col gap-5 border ${
                plan.highlighted
                  ? 'border-blue-200 shadow-lg shadow-blue-500/20'
                  : 'border-slate-200 shadow-slate-900/5'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Plan</span>
                  <h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-600">{plan.headline}</p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase text-white ${PLAN_COLORS[plan.name]}`}
                >
                  {plan.name.charAt(0)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-semibold text-slate-900">{plan.price}</div>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-3">
                <button
                  type="button"
                  className={`${
                    esActual
                      ? 'btn w-full cursor-default bg-slate-100 text-slate-500'
                    : esPendiente
                    ? 'btn w-full cursor-default bg-amber-100 text-amber-700'
                    : plan.highlighted
                    ? 'btn-primary w-full'
                    : 'btn w-full'
                  }`}
                  disabled={esActual || esPendiente || estaCargando}
                  onClick={() => iniciarPago(plan)}
                >
                  {esActual
                    ? 'Plan activo'
                    : esPendiente
                    ? 'Pago pendiente...'
                    : estaCargando
                    ? 'Generando pago...'
                    : 'Elegir este plan'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default PlanesPage
