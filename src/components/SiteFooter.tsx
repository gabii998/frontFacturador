import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-max flex flex-col gap-4 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-800">Facturador</p>
          <p className="text-xs text-slate-500">Operamos con transparencia y te damos control sobre tus datos.</p>
        </div>
        <nav className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <Link to="/politica-privacidad" className="hover:text-blue-700">
            Política de privacidad
          </Link>
          <Link to="/terminos-condiciones" className="hover:text-blue-700">
            Términos y condiciones
          </Link>
          <Link to="/eliminar-datos" className="hover:text-blue-700">
            Solicitar eliminación de datos
          </Link>
        </nav>
      </div>
    </footer>
  )
}
