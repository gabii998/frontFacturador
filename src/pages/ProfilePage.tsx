import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import SectionHeader from '../components/SectionHeader'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import HeaderPill from '../components/HeaderPill'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../services/profile'
import { AfipService } from '../services/afip'
import { AuthUser } from '../services/auth'
import { PLAN_COLORS_BY_CODE, PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'
import { PlansService, type PlanStatusResponse } from '../services/plans'
import type { PadronInfo } from '../models/afip'

export default function ProfilePage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!user) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError(new Error('Las contraseñas nuevas no coinciden'))
      return
    }

    setLoading(true)
    try {
      await changePassword({
        email: user.email,
        currentPassword,
        newPassword
      })
      setSuccess('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
      section='Tu perfil'
      icon={<ComprobanteIcon/>}
      title='Información de la cuenta'
      subtitle='Estos datos se muestran según la información que cargaste al registrarte.'
      rightContent={<ProfileHeaderInfo user={user} />} />

      <section className="card space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Cambiar contraseña</h2>
          <p className="text-sm text-slate-500">Ingresá tu contraseña actual y definí una nueva de al menos 8 caracteres.</p>
        </div>
        <ErrorBox error={error} />
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="auth-field__label">Contraseña actual</span>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="auth-field__label">Nueva contraseña</span>
            <input
              type="password"
              className="input"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="auth-field__label">Repetir nueva contraseña</span>
            <input
              type="password"
              className="input"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

const ProfileHeaderInfo = ({ user }: { user: AuthUser }) => {
  const navigate = useNavigate()
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [padronInfo, setPadronInfo] = useState<PadronInfo | null>(null)
  const [padronError, setPadronError] = useState<string | null>(null)
  const [loadingPadron, setLoadingPadron] = useState(false)

  useEffect(() => {
    let canceled = false
    setLoadingPlan(true)
    PlansService.getCurrent(user.id)
      .then((response) => {
        if (!canceled) {
          setPlanStatus(response)
        }
      })
      .catch((error) => {
        console.error('No se pudo obtener el plan actual', error)
        if (!canceled) {
          setPlanStatus(null)
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoadingPlan(false)
        }
      })
    return () => {
      canceled = true
    }
  }, [user.id])

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
      .catch((error: unknown) => {
        if (!canceled) {
          setPadronInfo(null)
          if (error instanceof Error) {
            setPadronError(error.message)
          } else {
            setPadronError('No pudimos obtener los datos del padrón en este momento.')
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

  const inicioActividadesLabel = useMemo(() => {
    if (loadingPadron) {
      return 'Inicio actividades: cargando...'
    }
    const inicio = padronInfo?.inicioActividades
    if (!inicio) return null
    const date = new Date(inicio)
    if (Number.isNaN(date.getTime())) {
      return `Inicio actividades: ${inicio}`
    }
    const formatted = new Intl.DateTimeFormat('es-AR', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(date)
    return `Inicio actividades: ${formatted}`
  }, [padronInfo?.inicioActividades, loadingPadron])

  const domicilioLabel = useMemo(() => {
    if (loadingPadron) {
      return 'Domicilio fiscal: cargando...'
    }
    const domicilio = padronInfo?.domicilio
    if (!domicilio) return null
    const parts = [domicilio.direccion, domicilio.localidad, domicilio.provincia]
      .filter(Boolean)
      .join(', ')
    const cp = domicilio.codigoPostal ? `CP ${domicilio.codigoPostal}` : null
    const adicional = domicilio.datoAdicional?.trim()
    const full = [parts, cp, adicional].filter(Boolean).join(' · ')
    return full.length > 0 ? `Domicilio fiscal: ${full}` : null
  }, [padronInfo?.domicilio, loadingPadron])

  return (
    <Fragment>
      <HeaderPill label={user.name ?? 'Sin datos'} dotColor="bg-indigo-500" />
      <HeaderPill label={user.email} dotColor="bg-indigo-500" />
      <HeaderPill label={user.cuit ?? 'Sin datos'} dotColor="bg-indigo-500" />
      {inicioActividadesLabel && (
        <HeaderPill label={inicioActividadesLabel} dotColor="bg-teal-500" />
      )}
      {domicilioLabel && (
        <HeaderPill label={domicilioLabel} dotColor="bg-teal-500" />
      )}
      {padronError && (
        <HeaderPill label={padronError} dotColor="bg-rose-500" />
      )}
      <div className="flex items-center gap-3">
        <HeaderPill
          label={planLabel}
          dotColor={planDotColor}
        />
        <button
          type="button"
          className="btn"
          onClick={irAComparativaPlanes}
        >
          Cambiar plan
        </button>
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
