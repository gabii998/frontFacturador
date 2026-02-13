import { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IonButton } from '@ionic/react'
import AuthFormLayout from '../../components/AuthFormLayout'
import FormFieldsArray, { type FormFieldConfig } from '../../components/FormFieldsArray'
import { useAuth } from '../../contexts/AuthContext'
import { RegisterForm } from '../../models/RegisterForms'
import { useAsyncRequest } from '../../hooks/useAsyncRequest'
import { useFormState } from '../../hooks/useFormState'
import { mapRegisterFormToRequest } from '../../mappers/formToRequest'
import { initialRegisterForm, REGISTER_FIELDS } from './form'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { values, setField } = useFormState<RegisterForm>(initialRegisterForm)
  const { loading, error, setError, run } = useAsyncRequest<void>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (values.password !== values.confirmPassword) {
      setError(new Error('Las contrasenas no coinciden'))
      return
    }

    const result = await run(() => register(mapRegisterFormToRequest(values)))

    if (result.ok) {
      navigate('/', { replace: true })
    }
  }

  const canSubmit =
    Boolean(
      values.name.trim() &&
      values.email.trim() &&
      values.phone.trim() &&
      values.password.trim() &&
      values.confirmPassword.trim()
    ) && !loading

  return (
    <AuthFormLayout
      title="Registrate para comenzar"
      subtitle="Genera tu acceso para emitir y consultar comprobantes AFIP desde un mismo panel de control."
      error={error}
      onSubmit={handleSubmit}
      footer={(
        <p>
          Ya tenes usuario?{' '}
          <Link to="/login" className="auth-link">Ingresa</Link>.
        </p>
      )}
    >
        <FormFieldsArray fields={REGISTER_FIELDS} values={values} setField={setField} />
        <IonButton
          type="submit"
          disabled={!canSubmit}
          expand="block"
          className="w-full"
        >
          {loading ? 'Creando mi cuenta...' : 'Crear mi cuenta'}
        </IonButton>
    </AuthFormLayout>
  )
}
