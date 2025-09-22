import { FormEvent, useState } from 'react'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import { changePassword } from '../services/profile'

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
      <section className="card space-y-4">
        <div>
          <span className="auth-eyebrow">Tu perfil</span>
          <h1 className="text-3xl font-semibold text-slate-900">Información de la cuenta</h1>
          <p className="text-sm text-slate-500">Estos datos se muestran según la información que cargaste al registrarte.</p>
        </div>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Nombre completo</dt>
            <dd className="mt-1 text-base text-slate-800">{user.name ?? 'Sin datos'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Email</dt>
            <dd className="mt-1 text-base text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">CUIT</dt>
            <dd className="mt-1 text-base text-slate-800">{user.cuit ?? 'Sin datos'}</dd>
          </div>
        </dl>
      </section>

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
