import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await requestPasswordReset({ email })
      setSuccess('Si el correo existe, vas a recibir un email con los pasos para recuperar tu contraseña.')
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = Boolean(email.trim()) && !loading

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <span className="auth-eyebrow">Recuperar acceso</span>
        <h1 className="auth-form__title">Restablecé tu contraseña</h1>
        <p className="auth-form__subtitle">
          Enviaremos un enlace temporal para que puedas definir una nueva contraseña y volver al panel.
        </p>
      </div>
      {error && <ErrorBox error={error} />}
      {success && <div className="auth-form__success">{success}</div>}
      <form className="auth-form__body" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-field__label">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando instrucciones...' : 'Enviarme instrucciones'}
        </button>
      </form>
      <div className="auth-form__footer">
        <Link to="/login" className="auth-link">Volver a iniciar sesión</Link>
      </div>
    </div>
  )
}
