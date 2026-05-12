import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorBox from '../components/ErrorBox'
import { useAuth } from '../contexts/AuthContext'
import { RegisterForm } from '../models/RegisterForms'
import FormField from '../components/FormField'

function formatCuit(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    phone: '',
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
    setForm(prev => ({
      ...prev,
      [name]: name === 'cuit' ? formatCuit(value) : value
    }))
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
        phone: form.phone,
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
      form.phone.trim() &&
      form.password.trim() &&
      form.confirmPassword.trim()
    ) && !loading

  return (
    <div className="auth-form auth-register">
      <ErrorBox error={error} />
      <form id="register-form" className="auth-form__body auth-register__body" onSubmit={handleSubmit}>
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
          label="Celular"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <FormField
          label="CUIT"
          name="cuit"
          value={form.cuit}
          onChange={handleChange}
          inputMode="numeric"
          maxLength={13}
          placeholder="xx-xxxxxxxx-x"
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
      </form>
      <div className="auth-form__footer auth-register__footer">
        <button
          type="submit"
          form="register-form"
          disabled={!canSubmit}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando mi cuenta...' : 'Crear mi cuenta'}
        </button>
        <p>
          ¿Ya tenés usuario?{' '}
          <Link to="/login" className="auth-link">Ingresá</Link>.
        </p>
      </div>
    </div>
  )
}
