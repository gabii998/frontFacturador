import { Link } from 'react-router-dom'
import ComprobantesExcelUpload from '../components/ComprobantesExcelUpload'

export default function ComprobantesCargaMasivaPage(){
  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg shadow-emerald-500/20 text-emerald-600">
              <svg
                className="h-7 w-7"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="13" width="30" height="24" rx="4" fill="#fff" />
                <path d="M16 21h16" />
                <path d="M16 27h16" />
                <path d="M16 33h10" />
                <path d="M13 9h22v4H13z" fill="#fff" />
                <path d="M19 9v4" />
                <path d="M29 9v4" />
              </svg>
            </div>
            <div className="space-y-2">
              <span className="auth-eyebrow">Comprobantes</span>
              <h1 className="text-2xl font-semibold text-slate-900">Carga masiva por Excel</h1>
              <p className="text-sm text-slate-600">
                Importá un archivo con los puntos de venta, tipos y números de comprobantes para validar su estado directamente contra AFIP.
              </p>
            </div>
          </div>
          <Link to="/comprobantes" className="btn">
            Volver al listado
          </Link>
        </div>
      </section>

      <ComprobantesExcelUpload />
    </div>
  )
}
