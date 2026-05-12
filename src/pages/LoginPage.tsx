import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../services/api'

function getLoginErrorMessage(error: unknown) {
  if (!error) return null
  if (error instanceof ApiError) {
    const suffix = error.message?.trim() || 'Error desconocido'
    return `${error.status} ${suffix}`
  }
  if (error instanceof Error) return error.message
  return String(error)
}

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
  const errorMessage = getLoginErrorMessage(error)

  return (
    <div className="auth-form auth-login">
      <div className="auth-login__intro">
        <div className="auth-form__header">
          <p className="auth-form__subtitle">
            Accedé a tu panel para emitir, consultar y compartir comprobantes.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="auth-login__loading" role="status" aria-live="polite">
          <span className="auth-modal-spinner" aria-hidden="true" />
          <span>Iniciando Sesion</span>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="auth-login__alert" role="alert">
              <span className="auth-login__alert-icon" aria-hidden="true">!</span>
              <div>
                <p className="auth-login__alert-title">No pudimos iniciar sesión</p>
                <p className="auth-login__alert-text">{errorMessage}</p>
              </div>
            </div>
          )}
          <form className="auth-form__body" onSubmit={handleSubmit}>
            <label className="auth-field">
              <span className="auth-field__label">Email</span>
              <input
                type="email"
                autoComplete="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span className="auth-field__row">
                <span className="auth-field__label">Contraseña</span>
                <Link to="/recuperar-clave" className="auth-link auth-link--muted">
                  Recuperar
                </Link>
              </span>
              <input
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
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
              Ingresar
            </button>
          </form>
          <div className="auth-form__footer auth-login__footer">
            <p>
              ¿Todavía no tenés cuenta?{' '}
              <Link to="/registrarse" className="auth-link">Registrate</Link>.
            </p>
            <p className="auth-login__legal">
              Al continuar aceptás nuestra{' '}
              <Link to="/politica-privacidad" className="auth-link">política de privacidad</Link>
              {' '}y los{' '}
              <Link to="/terminos-condiciones" className="auth-link">términos y condiciones</Link>.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
