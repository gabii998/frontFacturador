import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cuit, setCuit] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(new Error('Las contraseñas no coinciden'))
      return
    }

    setLoading(true)
    try {
      await register({ name, email, cuit: cuit || undefined, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = Boolean(name.trim() && email.trim() && password.trim() && confirmPassword.trim() && !loading)

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <span className="auth-eyebrow">Nueva cuenta</span>
        <h1 className="auth-form__title">Registrate para comenzar</h1>
        <p className="auth-form__subtitle">
          Generá tu acceso para emitir y consultar comprobantes AFIP desde un mismo panel de control.
        </p>
      </div>
      <ErrorBox error={error} />
      <form className="auth-form__body" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span className="auth-field__label">Nombre completo</span>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
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
          <span className="auth-field__label">CUIT</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="input"
            value={cuit}
            onChange={(event) => setCuit(event.target.value)}
            placeholder="Opcional"
          />
        </label>
        <label className="auth-field">
          <span className="auth-field__label">Contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className="auth-field">
          <span className="auth-field__label">Repetir contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando mi cuenta...' : 'Crear mi cuenta'}
        </button>
      </form>
      <div className="auth-form__footer">
        <p>
          ¿Ya tenés usuario?{' '}
          <Link to="/login" className="auth-link">Ingresá</Link>.
        </p>
      </div>
    </div>
  )
}
