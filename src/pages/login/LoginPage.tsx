import { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IonButton } from '@ionic/react'
import AuthFormLayout from '../../components/AuthFormLayout'
import FormFieldsArray, { type FormFieldConfig } from '../../components/FormFieldsArray'
import { useAuth } from '../../contexts/AuthContext'
import { useAsyncRequest } from '../../hooks/useAsyncRequest'
import { useFormState } from '../../hooks/useFormState'
import { mapLoginFormToRequest } from '../../mappers/formToRequest'
import { LOGIN_FIELDS, LoginFormValues } from './form'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { values, setField } = useFormState<LoginFormValues>({ email: '', password: '' })
  const { loading, error, run } = useAsyncRequest<void>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await run(() => login(mapLoginFormToRequest(values)))
    if (result.ok) {
      navigate('/', { replace: true })
    }
  }

  const canSubmit = values.email.trim().length > 0 && values.password.trim().length > 0 && !loading

  return (
    <AuthFormLayout
      eyebrow="Acceso seguro"
      title="Ingresa a tu cuenta"
      subtitle="Centraliza la gestion de tus comprobantes electronicos y segui cada operacion en tiempo real."
      error={error}
      onSubmit={handleSubmit}
      footer={(
        <>
          <Link to="/recuperar-clave" className="auth-link">Olvidaste tu contrasena?</Link>
          <p>
            Todavia no tenes cuenta?{' '}
            <Link to="/registrarse" className="auth-link">Registrate</Link>.
          </p>
          <p className="caption-copy">
            Al continuar aceptas nuestra{' '}
            <Link to="/politica-privacidad" className="auth-link">politica de privacidad</Link>
            {' '}y los{' '}
            <Link to="/terminos-condiciones" className="auth-link">terminos y condiciones</Link>.
          </p>
        </>
      )}
    >
        <FormFieldsArray fields={LOGIN_FIELDS} values={values} setField={setField} />
        <IonButton
          type="submit"
          disabled={!canSubmit}
          expand="block"
          className="w-full"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </IonButton>
    </AuthFormLayout>
  )
}
