import { useEffect, useMemo, useState } from 'react'
import { IonBadge, IonButton, IonCard, IonCardContent, IonIcon, IonItem, IonLabel, IonList, IonSpinner, IonText } from '@ionic/react'
import { checkmarkCircleOutline } from 'ionicons/icons'
import SectionHeader from '../components/SectionHeader'
import HeaderPill from '../components/HeaderPill'
import ErrorBox from '../components/ErrorBox'
import StatusNoticeCard from '../components/StatusNoticeCard'
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
import { useAuth } from '../contexts/AuthContext'
import { usePlanStatus } from '../hooks/usePlanStatus'

const PlanesPage = () => {
  const { user } = useAuth()
  const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
  const [mercadoPago, setMercadoPago] = useState<MercadoPagoInstance | null>(null)
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null)
  const [configError, setConfigError] = useState<unknown>(null)
  const [checkoutError, setCheckoutError] = useState<unknown>(null)
  const {
    planStatus,
    loading: fetchingPlanStatus,
    error: planError,
    refresh: fetchPlanStatus
  } = usePlanStatus({ userId: user?.id ?? null })

  const estadoPlan = planStatus?.status ?? 'ACTIVE'
  const planActivoCode: PlanCode = estadoPlan === 'ACTIVE' ? planStatus?.plan ?? 'free' : 'free'
  const planPendienteCode: PlanCode | null = estadoPlan === 'PENDING' ? planStatus?.plan ?? null : null
  const planActual: PlanName = PLAN_CODE_TO_NAME[planActivoCode]

  useEffect(() => {
    if (!publicKey) {
      setConfigError(new Error('Mercado Pago no esta configurado. Revisa la variable VITE_MERCADOPAGO_PUBLIC_KEY.'))
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

  const obtenerMercadoPago = async () => {
    if (!publicKey) {
      throw new Error('Mercado Pago no esta configurado. Revisa la variable VITE_MERCADOPAGO_PUBLIC_KEY.')
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
      setCheckoutError(new Error('Debes iniciar sesion para cambiar de plan.'))
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
        icon={<PlanesIcon />}
        title="Compara y elige el plan ideal"
        subtitle="Encontra la opcion que mejor se adapta a tu negocio y escala tu facturacion sin obstaculos."
        rightContent={<HeaderPill label={headerLabel} dotColor={headerDotColor} />}
      />

      {planStatus?.status === 'EXPIRED' && planStatus.previousPlan && (
        <StatusNoticeCard tone="warning">
          Tu plan {PLAN_CODE_TO_NAME[planStatus.previousPlan]} expiro. Pasaste nuevamente al plan Gratuito.
        </StatusNoticeCard>
      )}

      {planStatus?.status === 'PENDING' && planPendienteCode && (
        <StatusNoticeCard tone="info">
          Generamos el checkout de Mercado Pago para el plan {PLAN_CODE_TO_NAME[planPendienteCode]}. Apenas el pago se apruebe, se activara automaticamente.
        </StatusNoticeCard>
      )}

      {estadoPlan === 'ACTIVE' && formattedExpiration && (
        <StatusNoticeCard>
          Renova antes del <span className="font-semibold text-slate-800">{formattedExpiration}</span> para evitar interrupciones.
        </StatusNoticeCard>
      )}

      <ErrorBox error={error} />

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_DETAILS.map((plan) => {
          const esActual = estadoPlan === 'ACTIVE' && plan.code === planActivoCode
          const esPendiente = estadoPlan === 'PENDING' && planPendienteCode === plan.code
          const estaCargando = loadingPlan === plan.code

          return (
            <IonCard
              key={plan.name}
              className={`card flex h-full flex-col gap-5 border ${
                plan.highlighted
                  ? 'border-blue-200 shadow-lg shadow-blue-500/20'
                  : 'border-slate-200 shadow-slate-900/5'
              }`}
            >
              <IonCardContent className="flex h-full flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Plan</span>
                    <h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2>
                    <p className="body-copy">{plan.headline}</p>
                  </div>
                  <IonBadge className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase text-white ${PLAN_COLORS[plan.name]}`}>
                    {plan.name.charAt(0)}
                  </IonBadge>
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-semibold text-slate-900">{plan.price}</div>
                  <p className="body-copy-muted">{plan.description}</p>
                </div>

                <IonList className="space-y-2 bg-transparent p-0">
                  {plan.features.map((feature) => (
                    <IonItem key={feature} lines="none" className="body-copy rounded-lg bg-transparent">
                      <IonIcon icon={checkmarkCircleOutline} slot="start" className="text-blue-500" />
                      <IonLabel>{feature}</IonLabel>
                    </IonItem>
                  ))}
                </IonList>

                <div className="mt-auto pt-3">
                  <IonButton
                    expand="block"
                    fill={plan.highlighted && !esActual && !esPendiente ? 'solid' : 'outline'}
                    color={esActual ? 'medium' : esPendiente ? 'warning' : 'primary'}
                    disabled={esActual || esPendiente || estaCargando}
                    onClick={() => iniciarPago(plan)}
                  >
                    {estaCargando && <IonSpinner slot="start" name="crescent" />}
                    {esActual
                      ? 'Plan activo'
                      : esPendiente
                        ? 'Pago pendiente...'
                        : estaCargando
                          ? 'Generando pago...'
                          : 'Elegir este plan'}
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          )
        })}
      </div>
    </div>
  )
}

export default PlanesPage

