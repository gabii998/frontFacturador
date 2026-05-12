import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import PublicContentLayout from '../components/PublicContentLayout'
import { requestDataDeletion } from '../services/privacy'

export default function DataDeletionPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await requestDataDeletion(email)
      setCompleted(true)
      setEmail('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos registrar la solicitud. Intentalo más tarde.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim().length > 0 && !loading

  return (
    <PublicContentLayout
      eyebrow="Solicitar eliminación de datos"
      title="Controlá tu información en Facturador"
      subtitle="Completá tu correo electrónico para iniciar el proceso. Si existe una cuenta asociada, te enviaremos un enlace para confirmar la solicitud dentro de las próximas 24 horas."
      action={(
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      )}
    >
      <section className="public-section public-section--soft">
          {completed ? (
            <div className="space-y-4 text-sm text-emerald-700">
              <p className="rounded-lg bg-emerald-50 px-4 py-4 font-medium">
                Revisá tu bandeja de entrada. Si la cuenta existe, vas a recibir un enlace válido por 24 horas para confirmar la eliminación de los datos.
              </p>
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto"
                onClick={() => setCompleted(false)}
              >
                Realizar otra solicitud
              </button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">Correo electrónico</span>
                <input
                  type="email"
                  className="input"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </label>
              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn btn-primary w-full sm:w-auto"
                disabled={!canSubmit}
              >
                {loading ? 'Enviando solicitud...' : 'Solicitar enlace de eliminación'}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-slate-500">
            La solicitud no elimina los datos de inmediato. Necesitás confirmar la operación desde el enlace enviado por correo electrónico.
          </p>
      </section>

      <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link to="/politica-privacidad" className="public-link">
          Ver política de privacidad
        </Link>
        <Link to="/terminos-condiciones" className="public-link">
          Consultar términos y condiciones
        </Link>
      </div>
    </PublicContentLayout>
  )
}
