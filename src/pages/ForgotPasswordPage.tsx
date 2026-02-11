import { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { IonButton, IonText } from '@ionic/react'
import AuthFormLayout from '../components/AuthFormLayout'
import FormFieldsArray, { type FormFieldConfig } from '../components/FormFieldsArray'
import { useAuth } from '../contexts/AuthContext'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { useFormState } from '../hooks/useFormState'
import { mapForgotPasswordFormToRequest } from '../mappers/formToRequest'

type ForgotPasswordFormValues = {
  email: string
}

const FORGOT_PASSWORD_FIELDS: FormFieldConfig<ForgotPasswordFormValues>[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autocomplete: 'email',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  }
]

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth()
  const { values, setField } = useFormState<ForgotPasswordFormValues>({ email: '' })
  const { loading, error, success, run } = useAsyncRequest<void>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await run(() => requestPasswordReset(mapForgotPasswordFormToRequest(values)))
  }

  const canSubmit = Boolean(values.email.trim()) && !loading

  return (
    <AuthFormLayout
      eyebrow="Recuperar acceso"
      title="Restablece tu contrasena"
      subtitle="Enviaremos un enlace temporal para que puedas definir una nueva contrasena y volver al panel."
      error={error}
      notice={success ? (
        <IonText className="auth-form__success block">
          Si el correo existe, vas a recibir un email con los pasos para recuperar tu contrasena.
        </IonText>
      ) : null}
      onSubmit={handleSubmit}
      footer={<Link to="/login" className="auth-link">Volver a iniciar sesion</Link>}
    >
        <FormFieldsArray fields={FORGOT_PASSWORD_FIELDS} values={values} setField={setField} />
        <IonButton
          type="submit"
          disabled={!canSubmit}
          expand="block"
          className="w-full"
        >
          {loading ? 'Enviando instrucciones...' : 'Enviarme instrucciones'}
        </IonButton>
    </AuthFormLayout>
  )
}
