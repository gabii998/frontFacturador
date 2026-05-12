import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer id="contacto" className="landing-footer bg-orange-500 text-xs text-white md:text-sm">
      <div className="container-max grid gap-5 py-5 text-center md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6 md:py-6 md:text-left">
        <div className="hidden md:block space-y-1">
          <p className="text-sm font-semibold md:text-base">Facturador</p>
          <p className="text-[0.7rem] text-white/75 md:text-xs">Operamos con transparencia y te damos control sobre tus datos.</p>
        </div>
        <div className="space-y-1 md:text-right">
          <p className="font-semibold">Contacto</p>
          <a href="mailto:contacto@facturador.com" className="text-white/85 hover:text-white">
            contacto@facturador.com
          </a>
        </div>
        <nav className="flex flex-wrap justify-center gap-2 text-[0.75rem] md:col-span-2 md:text-sm md:gap-4 md:justify-center">
          <Link to="/ayuda" className="text-white/85 hover:text-white">
            Centro de ayuda
          </Link>
          <Link to="/politica-privacidad" className="text-white/85 hover:text-white">
            Política de privacidad
          </Link>
          <Link to="/terminos-condiciones" className="text-white/85 hover:text-white">
            Términos y condiciones
          </Link>
          <Link to="/eliminar-datos" className="text-white/85 hover:text-white">
            Solicitar eliminación de datos
          </Link>
        </nav>
      </div>
    </footer>
  )
}
