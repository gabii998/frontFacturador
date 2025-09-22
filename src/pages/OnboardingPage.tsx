import { FormEvent, useEffect, useMemo, useState } from 'react'
import ErrorBox from '../components/ErrorBox'
import Loader from '../components/Loader'
import { OnboardingService } from '../services/onboarding'
import { useOnboarding } from '../contexts/OnboardingContext'

interface UploadState {
  fileName: string | null
  base64: string | null
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const result = reader.result
      if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i += 1) {
          binary += String.fromCharCode(bytes[i])
        }
        resolve(btoa(binary))
      } else {
        reject(new Error('Formato de archivo no soportado'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export default function OnboardingPage() {
  const [certificate, setCertificate] = useState<UploadState>({ fileName: null, base64: null })
  const [privateKey, setPrivateKey] = useState<UploadState>({ fileName: null, base64: null })
  const [alias, setAlias] = useState('')
  const { status, loading: statusLoading, error: statusError, refresh } = useOnboarding()
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (status?.alias) {
      setAlias(status.alias)
    }
  }, [status?.alias])

  const canSubmit = useMemo(() => {
    return Boolean(alias.trim()) && Boolean(certificate.base64) && Boolean(privateKey.base64) && !loading
  }, [alias, certificate.base64, privateKey.base64, loading])

  const handleFile = async (file: File | undefined | null, setter: (value: UploadState) => void) => {
    if (!file) {
      setter({ fileName: null, base64: null })
      return
    }
    try {
      const base64 = await toBase64(file)
      setter({ fileName: file.name, base64 })
    } catch (err) {
      setError(err)
      setter({ fileName: null, base64: null })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    setSuccessMessage(null)
    setError(null)

    try {
      await OnboardingService.save({
        alias: alias.trim(),
        certificate: certificate.base64!,
        privateKey: privateKey.base64!
      })
      setSuccessMessage('Credenciales guardadas correctamente. Pueden demorar unos minutos en ser válidas en AFIP.')
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (statusLoading && !status) {
    return (
      <div className="card max-w-3xl mx-auto">
        <Loader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <span className="auth-eyebrow">Onboarding AFIP</span>
        <h1 className="text-3xl font-semibold text-slate-900">Configurar certificados digitales</h1>
        <p className="text-sm text-slate-500">
          Subí tu certificado emitido por AFIP, la clave privada asociada y el alias configurado en el WSAA. Guardamos la información de forma encriptada y solo se usará para firmar los pedidos contra la API.
        </p>
        <div className="tutorial-box">
          <div>
            <h2>¿Necesitás ayuda para obtenerlos?</h2>
            <p>Segu&iacute; el paso a paso para descargar el certificado, generar la clave y crear el alias en el WSAA.</p>
          </div>
          <a
            href="https://www.afip.gob.ar/ws/documentacion/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-light"
          >
            Ver tutorial oficial
          </a>
        </div>
        {status?.configured ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <strong className="block text-emerald-800">Credenciales configuradas</strong>
            <span>
              Alias WSAA: <b>{status.alias ?? '—'}</b>
            </span>
            {status.updatedAt && (
              <span className="block text-emerald-600 text-xs mt-1">Última actualización: {new Date(status.updatedAt).toLocaleString()}</span>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Aún no cargaste tus credenciales. Completá el formulario para habilitar las integraciones AFIP.
          </div>
        )}
      </section>

      <section className="card">
        <ErrorBox error={statusError || error} />
        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="auth-field__label">Alias en WSAA</span>
              <input
                type="text"
                className="input"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                placeholder="Ej: produccion-afip"
                required
              />
            </label>
            <div className="text-sm text-slate-500">
              <p className="font-medium text-slate-600">Requisitos</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Archivos en formato PEM (texto plano).</li>
                <li>Certificado y clave deben corresponder al mismo CUIT.</li>
                <li>El alias debe coincidir con el configurado en el WSAA.</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="auth-field__label">Certificado digital (.pem)</span>
              <input
                type="file"
                accept=".pem,.crt"
                onChange={(event) => handleFile(event.target.files?.[0], setCertificate)}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {certificate.fileName && (
                <span className="text-xs text-slate-500">Seleccionado: {certificate.fileName}</span>
              )}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="auth-field__label">Clave privada (.key)</span>
              <input
                type="file"
                accept=".pem,.key"
                onChange={(event) => handleFile(event.target.files?.[0], setPrivateKey)}
                className="input file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {privateKey.fileName && (
                <span className="text-xs text-slate-500">Seleccionado: {privateKey.fileName}</span>
              )}
            </label>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Guardamos la información cifrada con una clave maestra. Podés actualizarla en cualquier momento cargando nuevos archivos.
            </p>
            <button type="submit" className="btn-primary" disabled={!canSubmit}>
              {loading ? 'Guardando...' : 'Guardar credenciales'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
