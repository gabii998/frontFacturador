import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { IonButton, IonCard, IonCardContent, IonText } from '@ionic/react'
import FormFieldsArray, { type FormFieldConfig } from '../components/FormFieldsArray'
import { requestDataDeletion } from '../services/privacy'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { useFormState } from '../hooks/useFormState'
import { mapDataDeletionFormToRequest } from '../mappers/formToRequest'

type DataDeletionFormValues = {
  email: string
}

const DATA_DELETION_FIELDS: FormFieldConfig<DataDeletionFormValues>[] = [
  {
    name: 'email',
    label: 'Correo electronico',
    type: 'email',
    required: true,
    placeholder: 'ejemplo@correo.com',
    disabled: false,
    variant: 'sm',
    labelClassName: 'font-medium text-slate-700'
  }
]

export default function DataDeletionPage() {
  const { values, setField, reset } = useFormState<DataDeletionFormValues>({ email: '' })
  const [completed, setCompleted] = useState(false)
  const { loading, error, run } = useAsyncRequest<void>()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await run(() => requestDataDeletion(mapDataDeletionFormToRequest(values)))
    if (result.ok) {
      setCompleted(true)
      reset()
    }
  }

  const canSubmit = values.email.trim().length > 0 && !loading
  const fields = DATA_DELETION_FIELDS.map((field) => ({ ...field, disabled: loading }))

  return (
    <div className="page-bg">
      <div className="page-shell-spacious flex flex-col gap-10">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Solicitar eliminacion de datos</p>
          <h1 className="text-3xl font-semibold text-slate-900">Controla tu informacion en Facturador</h1>
          <p className="body-copy">
            Completa tu correo electronico para iniciar el proceso de eliminacion. Si existe una cuenta asociada te enviaremos un enlace
            para confirmar la solicitud dentro de las proximas 24 horas.
          </p>
        </header>

        <IonCard className="surface-card">
          <IonCardContent>
            {completed ? (
              <div className="space-y-4 text-sm text-emerald-700">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  Revisa tu bandeja de entrada. Si la cuenta existe, vas a recibir un enlace valido por 24 horas para confirmar la eliminacion de los datos.
                </p>
                <IonButton
                  type="button"
                  fill="outline"
                  onClick={() => setCompleted(false)}
                >
                  Realizar otra solicitud
                </IonButton>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <FormFieldsArray fields={fields} values={values} setField={setField} />
                {Boolean(error) && (
                  <IonText color="danger" className="text-sm">
                    {error instanceof Error ? error.message : String(error)}
                  </IonText>
                )}
                <IonButton
                  type="submit"
                  disabled={!canSubmit}
                >
                  {loading ? 'Enviando solicitud...' : 'Solicitar enlace de eliminacion'}
                </IonButton>
              </form>
            )}

            <p className="caption-copy mt-4">
              La solicitud no elimina los datos de inmediato. Necesitas confirmar la operacion desde el enlace enviado por correo electronico.
            </p>
          </IonCardContent>
        </IonCard>

        <div className="body-copy flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Link to="/politica-privacidad" className="hover:text-blue-700">
            Ver politica de privacidad
          </Link>
          <Link to="/terminos-condiciones" className="hover:text-blue-700">
            Consultar terminos y condiciones
          </Link>
          <Link to="/" className="hover:text-blue-700">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
