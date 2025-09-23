import { FormEvent, Fragment, useState } from 'react'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../services/profile'
import SectionHeader from '../components/SectionHeader'
import ComprobanteIcon from '../icon/ComprobanteIcon'
import HeaderPill from '../components/HeaderPill'
import { AuthUser } from '../services/auth'

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

const ProfileHeaderInfo = ({user}:{user:AuthUser}) => {
  return(
    <Fragment>
      <HeaderPill label={user.name ?? 'Sin datos'} dotColor='bg-indigo-500'/>
      <HeaderPill label={user.email} dotColor='bg-indigo-500' />
      <HeaderPill label={user.cuit ?? 'Sin datos'} dotColor='bg-indigo-500' />
    </Fragment>
  )
}
