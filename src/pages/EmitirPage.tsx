import EmitirForm from '../components/EmitirForm'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'

const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
})

const identificationThreshold = formatter.format(CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD)

export default function EmitirPage() {
  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-r from-indigo-50 via-sky-50 to-blue-50 border border-indigo-100">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-indigo-500/20 text-indigo-600">
              <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="12" width="20" height="14" rx="3" fill="#fff" />
                <path d="M10 12v-4c0-2.2 1.8-4 4-4h4l2 4h6c2.2 0 4 1.8 4 4v3" />
                <path d="M20 8h-6" />
                <circle cx="13" cy="20" r="2" fill="currentColor" />
                <path d="M16 23h8" />
                <path d="M16 27h12" />
              </svg>
            </div>
            <div className="max-w-2xl space-y-2">
              <span className="auth-eyebrow">Emisión</span>
              <h1 className="text-2xl font-semibold text-slate-900">Emití tus comprobantes desde un solo lugar</h1>
              <p className="text-sm text-slate-600">
                Centralizá la operatoria con AFIP WSFE y generá comprobantes con validaciones automáticas y seguimiento en tiempo real.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-indigo-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Servicio WSFE activo
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
              Umbral sin identificación: {identificationThreshold}
            </span>
          </div>
        </div>
      </section>

      <section>
        <EmitirForm />
      </section>
    </div>
  )
}
