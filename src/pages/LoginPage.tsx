import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim().length > 0 && password.trim().length > 0 && !loading

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <span className="auth-eyebrow">Acceso seguro</span>
        <h1 className="auth-form__title">Ingresá a tu cuenta</h1>
        <p className="auth-form__subtitle">
          Centralizá la gestión de tus comprobantes electrónicos y seguí cada operación en tiempo real.
        </p>
      </div>
      {error && <ErrorBox error={error} />}
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
        <label className="auth-field">
          <span className="auth-field__label">Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="auth-form__footer">
        <Link to="/recuperar-clave" className="auth-link">
          ¿Olvidaste tu contraseña?
        </Link>
        <p>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/registrarse" className="auth-link">Registrate</Link>.
        </p>
      </div>
    </div>
  )
}
