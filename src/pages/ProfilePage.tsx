import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../services/profile'
import { AfipService } from '../services/afip'
import { AuthUser } from '../services/auth'
import { PLAN_CODE_TO_NAME, type PlanCode } from '../constants/planes'
import { PlansService, type PlanStatusResponse } from '../services/plans'
import type { PadronInfo } from '../models/afip'
import { IconCreditCard, IconMail, IconShieldLock, IconUserCircle } from '@tabler/icons-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [padronInfo, setPadronInfo] = useState<PadronInfo | null>(null)
  const [padronError, setPadronError] = useState<string | null>(null)
  const [loadingPadron, setLoadingPadron] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  useEffect(() => {
    if (!user?.cuit) {
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
  }, [user?.cuit])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
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

  const openPasswordModal = () => {
    setError(null)
    setSuccess(null)
    setPasswordModalOpen(true)
  }

  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    setError(null)
    setSuccess(null)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
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

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <ProfileAccountCard
        user={user}
        cuit={user.cuit}
        inicioActividades={inicioActividadesLabel}
        domicilio={domicilioLabel}
        padronError={padronError}
        onChangePassword={openPasswordModal}
      />

      {passwordModalOpen && createPortal(
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
          <button
            type="button"
            className="auth-modal__backdrop"
            aria-label="Cerrar modal"
            onClick={closePasswordModal}
          />
          <div className="auth-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__header">
              <h1 id="password-modal-title" className="auth-modal__title">Cambiar contraseña</h1>
              <button
                type="button"
                className="auth-modal__close"
                aria-label="Cerrar modal"
                onClick={closePasswordModal}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Ingresá tu contraseña actual y definí una nueva de al menos 8 caracteres.
              </p>
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
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const ProfileAccountCard = ({
  user,
  cuit,
  inicioActividades,
  domicilio,
  padronError,
  onChangePassword
}: {
  user: AuthUser
  cuit?: string | null
  inicioActividades: string | null
  domicilio: string | null
  padronError: string | null
  onChangePassword: () => void
}) => {
  const navigate = useNavigate()
  const [planStatus, setPlanStatus] = useState<PlanStatusResponse | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(false)
  

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

  

  const estadoPlan = planStatus?.status ?? 'ACTIVE'
  const planActivoCode: PlanCode = estadoPlan === 'ACTIVE' ? planStatus?.plan ?? 'free' : 'free'
  const planPendienteCode: PlanCode | null = estadoPlan === 'PENDING' ? planStatus?.plan ?? null : null

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
    <section className="card space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Datos de la cuenta</h2>
          <p className="text-sm text-slate-500">Información principal del usuario, plan y datos fiscales vinculados.</p>
        </div>
      </div>

      <div className="profile-account-summary">
        <ProfileSummaryCard
          icon={<IconUserCircle />}
          label="Nombre"
          value={user.name ?? 'Sin datos'}
        />
        <ProfileSummaryCard
          icon={<IconMail />}
          label="Email"
          value={user.email}
        />
        <ProfileSummaryCard
          icon={<IconCreditCard />}
          label={estadoPlan === 'PENDING' ? 'Plan en proceso' : 'Plan actual'}
          value={loadingPlan
            ? 'Cargando...'
            : estadoPlan === 'PENDING' && planPendienteCode
              ? PLAN_CODE_TO_NAME[planPendienteCode]
              : PLAN_CODE_TO_NAME[planActivoCode]
          }
          detail={[
            paymentStatusLabel ? `Pago: ${paymentStatusLabel}` : null,
            formattedExpiration ? `Vence: ${formattedExpiration}` : null
          ].filter(Boolean).join(' · ')}
          actionLabel="Cambiar"
          onAction={irAComparativaPlanes}
        />
        <ProfileSummaryCard
          icon={<IconShieldLock />}
          label="Seguridad"
          value="Contraseña activa"
          actionLabel="Cambiar"
          onAction={onChangePassword}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AccountDetail label="CUIT" value={cuit ?? 'Sin datos'} />
        <AccountDetail label="Inicio de actividades" value={inicioActividades ?? 'Sin datos'} />
        <AccountDetail label="Domicilio fiscal" value={domicilio ?? 'Sin datos'} />
      </div>

      {padronError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {padronError}
        </div>
      )}
    </section>
  )
}

const AccountDetail = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

const ProfileSummaryCard = ({
  icon,
  label,
  value,
  detail,
  actionLabel,
  onAction
}: {
  icon: ReactNode
  label: string
  value: string
  detail?: string
  actionLabel?: string
  onAction?: () => void
}) => {
  const interactive = Boolean(onAction)
  const content = (
    <>
      <div className="profile-summary-card__icon">{icon}</div>
      <div className="profile-summary-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <p>{detail}</p>}
      </div>
      {actionLabel && (
        <span className="profile-summary-card__action">
          {actionLabel}
        </span>
      )}
    </>
  )

  if (interactive) {
    return (
      <button type="button" className="profile-summary-card profile-summary-card--button" onClick={onAction}>
        {content}
      </button>
    )
  }

  return (
    <div className="profile-summary-card">
      {content}
    </div>
  )
}
