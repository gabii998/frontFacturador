import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import { RegisterForm } from '../models/RegisterForms'
import FormField from '../components/FormField'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    cuit: '',
    condicionImpositiva: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError(new Error('Las contraseñas no coinciden'))
      return
    }

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        cuit: form.cuit || undefined,
        password: form.password
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    Boolean(
      form.name.trim() &&
      form.email.trim() &&
      form.password.trim() &&
      form.confirmPassword.trim()
    ) && !loading

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
        <FormField
          label="Nombre completo"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <FormField
          label="CUIT"
          name="cuit"
          value={form.cuit}
          onChange={handleChange}
          required
        />

        <FormField
          label="Condición Impositiva"
          name="condicionImpositiva"
          value={form.condicionImpositiva}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione...</option>
          <option value="Monotributista">Monotributista</option>
          <option value="Responsable Inscripto">Responsable Inscripto</option>
        </FormField>

        <FormField
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
        />

        <FormField
          label="Repetir contraseña"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          minLength={8}
        />

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
