import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonButton, IonCard, IonCardContent, IonText } from '@ionic/react'
import { IconUser } from '@tabler/icons-react'
import ErrorBox from '../components/ErrorBox'
import FormFieldsArray, { type FormFieldConfig } from '../components/FormFieldsArray'
import SectionHeader from '../components/SectionHeader'
import HeaderPill from '../components/HeaderPill'
import { useFormState } from '../hooks/useFormState'
import { usePlanStatus } from '../hooks/usePlanStatus'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../services/profile'
import { AfipService } from '../services/afip'
import { AuthUser } from '../services/auth'
import { PLAN_COLORS_BY_CODE, PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'
import type { PadronInfo } from '../models/afip'
import { mapChangePasswordFormToRequest } from '../mappers/formToRequest'

type PasswordFormValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const PASSWORD_FIELDS: FormFieldConfig<PasswordFormValues>[] = [
  {
    name: 'currentPassword',
    label: 'Contrasena actual',
    type: 'password',
    required: true,
    labelClassName: 'auth-field__label'
  },
  {
    name: 'newPassword',
    label: 'Nueva contrasena',
    type: 'password',
    minLength: 8,
    required: true,
    labelClassName: 'auth-field__label'
  },
  {
    name: 'confirmPassword',
    label: 'Repetir nueva contrasena',
    type: 'password',
    minLength: 8,
    required: true,
    labelClassName: 'auth-field__label'
  }
]

export default function ProfilePage() {
  const { user } = useAuth()
  const passwordForm = useFormState<PasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [padronInfo, setPadronInfo] = useState<PadronInfo | null>(null)
  const [padronError, setPadronError] = useState<string | null>(null)
  const [loadingPadron, setLoadingPadron] = useState(false)

  if (!user) {
    return null
  }

  useEffect(() => {
    if (!user.cuit) {
      setPadronInfo(null)
      setPadronError(null)
      return
    }
    let canceled = false
    setLoadingPadron(true)
    setPadronError(null)
    AfipService.padron(user.cuit)
      .then((response) => {
        if (!canceled) {
          setPadronInfo(response)
          setPadronError(null)
        }
      })
      .catch((requestError: unknown) => {
        if (!canceled) {
          setPadronInfo(null)
          if (requestError instanceof Error) {
            setPadronError(requestError.message)
          } else {
            setPadronError('No pudimos obtener los datos del padron en este momento.')
          }
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoadingPadron(false)
        }
      })
    return () => {
      canceled = true
    }
  }, [user.cuit])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (passwordForm.values.newPassword !== passwordForm.values.confirmPassword) {
      setError(new Error('Las contrasenas nuevas no coinciden'))
      return
    }

    setLoading(true)
    try {
      await changePassword(mapChangePasswordFormToRequest(user.email, {
        currentPassword: passwordForm.values.currentPassword,
        newPassword: passwordForm.values.newPassword
      }))
      setSuccess('Contrasena actualizada correctamente')
      passwordForm.reset()
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLoading(false)
    }
  }

  const inicioActividadesLabel = useMemo(() => {
    if (loadingPadron) {
      return 'cargando...'
    }
    const inicio = padronInfo?.inicioActividades
    if (!inicio) return null
    const date = new Date(inicio)
    if (Number.isNaN(date.getTime())) {
      return `${inicio}`
    }
    const formatted = new Intl.DateTimeFormat('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date)
    return `${formatted}`
  }, [padronInfo?.inicioActividades, loadingPadron])

  const domicilioLabel = useMemo(() => {
    if (loadingPadron) {
      return 'cargando...'
    }
    const domicilio = padronInfo?.domicilio
    if (!domicilio) return null
    const parts = [domicilio.direccion, domicilio.localidad, domicilio.provincia]
      .filter(Boolean)
      .join(', ')
    const adicional = domicilio.datoAdicional?.trim()
    const full = [parts, adicional].filter(Boolean).join(' · ')
    return full.length > 0 ? `${full}` : null
  }, [padronInfo?.domicilio, loadingPadron])

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<IconUser />}
        title="Informacion de la cuenta"
        subtitle="Estos datos se muestran segun la informacion que cargaste al registrarte."
        rightContent={<ProfileHeaderInfo user={user} />}
      />

      <IonCard className="card space-y-4">
        <IonCardContent className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cambiar contrasena</h2>
            <p className="body-copy-muted">Ingresa tu contrasena actual y defini una nueva de al menos 8 caracteres.</p>
          </div>
          <ErrorBox error={error} />
          {success && (
            <IonText className="block rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </IonText>
          )}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormFieldsArray
              fields={PASSWORD_FIELDS}
              values={passwordForm.values}
              setField={passwordForm.setField}
            />
            <div className="flex justify-end">
              <IonButton type="submit" disabled={loading}>
                {loading ? 'Actualizando...' : 'Guardar nueva contrasena'}
              </IonButton>
            </div>
          </form>
        </IonCardContent>
      </IonCard>

      <IonCard className="card">
        <IonCardContent className="space-y-3 body-copy">
          <h2 className="text-lg font-semibold text-slate-900">Datos fiscales (padron)</h2>
          {padronError && <IonText color="danger">{padronError}</IonText>}
          {!padronError && (
            <>
              <p><strong>CUIT:</strong> {user.cuit ?? 'No informado'}</p>
              <p><strong>Titular:</strong> {user.name ?? 'No disponible'}</p>
              <p><strong>Inicio de actividades:</strong> {inicioActividadesLabel ?? 'No disponible'}</p>
              <p><strong>Domicilio:</strong> {domicilioLabel ?? 'No disponible'}</p>
            </>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  )
}

const ProfileHeaderInfo = ({ user }: { user: AuthUser }) => {
  const navigate = useNavigate()
  const { planStatus, loading: loadingPlan } = usePlanStatus({
    userId: user.id,
    onError: (error) => {
      console.error('No se pudo obtener el plan actual', error)
    }
  })

  const estadoPlan = planStatus?.status ?? 'ACTIVE'
  const planActivoCode: PlanCode = estadoPlan === 'ACTIVE' ? planStatus?.plan ?? 'free' : 'free'
  const planPendienteCode: PlanCode | null = estadoPlan === 'PENDING' ? planStatus?.plan ?? null : null

  const planLabel = useMemo(() => {
    if (loadingPlan) {
      return 'Plan actual: cargando...'
    }
    if (estadoPlan === 'PENDING' && planPendienteCode) {
      return `Plan en proceso: ${PLAN_CODE_TO_NAME[planPendienteCode]}`
    }
    return `Plan actual: ${PLAN_CODE_TO_NAME[planActivoCode]}`
  }, [loadingPlan, estadoPlan, planPendienteCode, planActivoCode])

  const planDotColor = estadoPlan === 'PENDING' && planPendienteCode
    ? 'bg-amber-500'
    : PLAN_COLORS_BY_CODE[planActivoCode]

  const paymentStatusLabel = useMemo(() => {
    if (!planStatus?.paymentStatus) {
      return null
    }
    return planStatus.paymentStatus.toLowerCase().replace(/_/g, ' ')
  }, [planStatus?.paymentStatus])

  const formattedExpiration = useMemo(() => {
    if (estadoPlan !== 'ACTIVE') {
      return null
    }
    if (!planStatus?.expiresAt || planActivoCode === 'free') {
      return null
    }
    const date = new Date(planStatus.expiresAt)
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }, [estadoPlan, planStatus?.expiresAt, planActivoCode])

  const irAComparativaPlanes = () => {
    navigate('/configuracion/planes')
  }

  return (
    <Fragment>
      <HeaderPill label={user.name ?? 'Sin datos'} dotColor="bg-indigo-500" />
      <HeaderPill label={user.email} dotColor="bg-indigo-500" />
      <div className="flex items-center gap-3">
        <HeaderPill
          label={planLabel}
          dotColor={planDotColor}
        />
        <IonButton size="small" fill="outline" onClick={irAComparativaPlanes}>Cambiar plan</IonButton>
      </div>
      {estadoPlan === 'PENDING' && paymentStatusLabel && (
        <HeaderPill
          label={`Estado de pago: ${paymentStatusLabel}`}
          dotColor="bg-amber-500"
        />
      )}
      {formattedExpiration && (
        <HeaderPill
          label={`Vence: ${formattedExpiration}`}
          dotColor="bg-slate-400"
        />
      )}
    </Fragment>
  )
}
