import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-0">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Solicitar eliminación de datos</p>
          <h1 className="text-3xl font-semibold text-slate-900">Controlá tu información en Facturador</h1>
          <p className="text-sm text-slate-600">
            Completá tu correo electrónico para iniciar el proceso de eliminación. Si existe una cuenta asociada te enviaremos un enlace
            para confirmar la solicitud dentro de las próximas 24 horas.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {completed ? (
            <div className="space-y-4 text-sm text-emerald-700">
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                Revisá tu bandeja de entrada. Si la cuenta existe, vas a recibir un enlace válido por 24 horas para confirmar la eliminación de los datos.
              </p>
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
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

        <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:gap-4">
          <Link to="/politica-privacidad" className="hover:text-blue-700">
            Ver política de privacidad
          </Link>
          <Link to="/terminos-condiciones" className="hover:text-blue-700">
            Consultar términos y condiciones
          </Link>
          <Link to="/" className="hover:text-blue-700">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
