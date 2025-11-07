import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-xs md:text-sm">
      <div className="container-max flex flex-col items-center gap-3 py-4 text-slate-600 text-center md:flex-row md:items-center md:justify-between md:gap-6 md:py-6 md:text-left">
        <div className="hidden md:block space-y-1">
          <p className="text-sm font-semibold text-slate-800 md:text-base">Facturador</p>
          <p className="text-[0.7rem] text-slate-500 md:text-xs">Operamos con transparencia y te damos control sobre tus datos.</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-2 text-[0.75rem] md:text-sm md:gap-4 md:justify-start">
          <Link to="/ayuda" className="hover:text-blue-700">
            Centro de ayuda
          </Link>
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
