import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import PuntosVentaPage from './pages/PuntosVentaPage'
import ComprobantesPage from './pages/ComprobantesPage'
import ComprobantesCargaMasivaPage from './pages/ComprobantesCargaMasivaPage'
import EmitirPage from './pages/EmitirPage'
import ProfilePage from './pages/ProfilePage'
import PlanesPage from './pages/PlanesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminOpsPage from './pages/AdminOpsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import DataDeletionPage from './pages/DataDeletionPage'
import HelpPage from './pages/HelpPage'
import { useAuth } from './contexts/AuthContext'
import SiteFooter from './components/SiteFooter'
import { PLAN_DETAILS } from './constants/planes'

function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileVisible, setMobileVisible] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const link = 'px-3 py-2 rounded-xl hover:bg-gray-100'
  const active = 'bg-orange-50 text-orange-700'

  const links = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/puntos-venta', label: 'Puntos de venta' },
    { to: '/comprobantes', label: 'Comprobantes' },
    { to: '/emitir', label: 'Emitir' },
    { to: '/configuracion', label: 'Configuración' },
    ...(user?.role === 'SUPERUSER'
      ? [
          { to: '/admin/ops', label: 'Ops' },
          { to: '/admin/usuarios', label: 'Superusuario' }
        ]
      : [])
  ]

  useEffect(() => () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
  }, [])

  const openMobileMenu = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current)
      closeTimeout.current = null
    }
    setMobileVisible(true)
    requestAnimationFrame(() => setMobileOpen(true))
  }

  const closeMobileMenu = () => {
    setMobileOpen(false)
    closeTimeout.current = setTimeout(() => {
      setMobileVisible(false)
    }, 250)
  }

  const handleLogout = async () => {
    await logout()
    closeMobileMenu()
  }

  return (
    <header className="bg-white border-b fixed top-0 left-0 right-0 z-40 md:static md:top-auto">
      <div className="container-max flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-label="Abrir menú"
            onClick={openMobileMenu}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-lg">Facturador</span>
          <nav className="hidden md:flex gap-1">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `${link} ${isActive ? active : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="text-gray-600 text-right">
                <div className="font-medium text-gray-800">{user.name ?? user.email}</div>
                <div className="text-xs">{user.email}</div>
              </div>
            )}
            <button onClick={handleLogout} className="btn text-sm">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
      {mobileVisible && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-[80%] max-w-sm bg-white flex flex-col rounded-r-3xl border-r border-slate-100 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="relative overflow-hidden rounded-tr-3xl rounded-br-3xl">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 pb-8 pt-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/70">Facturador</p>
                    <p className="text-lg font-semibold">Panel principal</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20 text-white hover:bg-white/30"
                    aria-label="Cerrar menú"
                    onClick={closeMobileMenu}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 6l12 12" />
                      <path d="M18 6l-12 12" />
                    </svg>
                  </button>
                </div>
                {user && (
                  <div className="mt-5 rounded-2xl bg-white/20 px-4 py-3 text-sm">
                    <p className="font-semibold">{user.name ?? user.email}</p>
                    <p className="text-xs text-white/70">{user.email}</p>
                  </div>
                )}
              </div>
            </div>
            <nav className="flex flex-col gap-2 px-5 py-6 text-sm text-slate-700">
              {links.map(({ to, label, end }) => (
                <NavLink
                  key={`mobile-${to}`}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `rounded-2xl border px-3 py-3 transition-colors ${
                      isActive
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="mt-auto space-y-3 px-5 pb-6 text-sm text-slate-600">
                <button
                  type="button"
                  className="btn btn-secondary w-full justify-center"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
                <p className="text-center text-xs text-slate-400">Sesión protegida con AFIP WSFE</p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function PrivateLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container-max flex-1 pb-6 pt-20 md:py-6">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

function SuperuserOnlyRoute() {
  const { user } = useAuth()
  if (user?.role !== 'SUPERUSER') {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

function PublicPage() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const authView =
    location.pathname === '/login'
      ? 'login'
      : location.pathname === '/registrarse'
        ? 'register'
        : location.pathname === '/recuperar-clave'
          ? 'forgot-password'
          : null

  const closeModal = () => {
    navigate('/', { replace: true })
  }

  const renderAuthContent = () => {
    switch (authView) {
      case 'login':
        return <LoginPage />
      case 'register':
        return <RegisterPage />
      case 'forgot-password':
        return <ForgotPasswordPage />
      default:
        return null
    }
  }

  return (
    <div className="landing-page min-h-screen flex flex-col bg-white text-slate-900">
      <main className="landing-shell flex-1">
        <section className="landing-snap-section landing-first-section">
          <header className="landing-toolbar">
            <div className="landing-toolbar__brand">Facturador</div>
            <nav className="landing-toolbar__nav" aria-label="Secciones principales">
              <a href="#funciones" className="landing-toolbar__link">Funciones</a>
              <a href="#precio" className="landing-toolbar__link">Precio</a>
              <a href="#contacto" className="landing-toolbar__link">Contacto</a>
            </nav>
            <div className="landing-toolbar__actions">
              <Link to="/login" className="landing-toolbar__login">
                Iniciar sesión
              </Link>
            </div>
          </header>
          <div className="landing-hero landing-hero--centered">
            <div className="landing-hero__content landing-hero__content--centered">
              <h1 className="landing-hero__title">Facturación clara, directa y en un solo lugar.</h1>
              <p className="landing-hero__subtitle">
                Centralizá emisión, consulta de comprobantes y seguimiento operativo sin depender de una pantalla recargada.
              </p>
              <div className="landing-hero__illustration" aria-hidden="true">
                <img
                  src="/illustrations/landing-invoicing-hero.png"
                  alt=""
                  className="landing-hero__image"
                />
              </div>
            </div>
          </div>
        </section>
        <section id="funciones" className="landing-snap-section landing-features">
          <div className="landing-features__header">
            <h2 className="landing-features__title">Funciones para operar sin interrupciones.</h2>
            <p className="landing-features__subtitle">
              Herramientas simples para emitir, compartir y sostener la facturación diaria desde cualquier contexto.
            </p>
          </div>
          <div className="landing-feature-list">
            <article className="landing-feature-item">
              <div className="landing-feature-item__media" aria-hidden="true">
                <img
                  src="/illustrations/features/feature-whatsapp.png"
                  alt=""
                  className="landing-feature-item__image"
                />
              </div>
              <div className="landing-feature-item__content">
                <h2 className="landing-feature-item__title">Facturas por whatsapp</h2>
                <p className="landing-feature-item__text">
                  Emisión desde conversaciones operativas, sin sacar al usuario de su flujo habitual.
                </p>
              </div>
            </article>
            <article className="landing-feature-item">
              <div className="landing-feature-item__media" aria-hidden="true">
                <img
                  src="/illustrations/features/feature-offline.png"
                  alt=""
                  className="landing-feature-item__image"
                />
              </div>
              <div className="landing-feature-item__content">
                <h2 className="landing-feature-item__title">Facturas cuando arca este offline</h2>
                <p className="landing-feature-item__text">
                  La operación sigue disponible aun cuando el servicio externo no responde en tiempo real.
                </p>
              </div>
            </article>
            <article className="landing-feature-item">
              <div className="landing-feature-item__media" aria-hidden="true">
                <img
                  src="/illustrations/features/feature-pdf.png"
                  alt=""
                  className="landing-feature-item__image"
                />
              </div>
              <div className="landing-feature-item__content">
                <h2 className="landing-feature-item__title">Generacion de pdfs</h2>
                <p className="landing-feature-item__text">
                  Comprobantes listos para compartir, descargar y conservar dentro del circuito administrativo.
                </p>
              </div>
            </article>
            <article className="landing-feature-item">
              <div className="landing-feature-item__media" aria-hidden="true">
                <img
                  src="/illustrations/features/feature-devices.png"
                  alt=""
                  className="landing-feature-item__image"
                />
              </div>
              <div className="landing-feature-item__content">
                <h2 className="landing-feature-item__title">Accesible desde cualquier dispositivo</h2>
                <p className="landing-feature-item__text">
                  La operación acompaña al usuario en escritorio, tablet o móvil sin cambiar de flujo de trabajo.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section id="precio" className="landing-snap-section landing-pricing">
          <div className="landing-pricing__header">
            <h2 className="landing-pricing__title">Precio simple para cada etapa.</h2>
            <p className="landing-pricing__subtitle">
              Elegí un plan según tu volumen de operación y cambiá cuando tu equipo lo necesite.
            </p>
          </div>
          <div className="landing-pricing__grid">
            {PLAN_DETAILS.map((plan) => (
              <article
                key={plan.code}
                className={`landing-plan ${plan.highlighted ? 'landing-plan--highlighted' : ''}`}
              >
                <div className="landing-plan__header">
                  <h3 className="landing-plan__name">{plan.name}</h3>
                  <p className="landing-plan__headline">{plan.headline}</p>
                </div>
                <p className="landing-plan__price">{plan.price}</p>
                <p className="landing-plan__description">{plan.description}</p>
                <ul className="landing-plan__features">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link
                  to={plan.code === 'free' ? '/registrarse' : '/login'}
                  className={plan.highlighted ? 'btn-primary landing-plan__action' : 'landing-plan__action landing-plan__action--secondary'}
                >
                  {plan.code === 'free' ? 'Empezar' : 'Consultar'}
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      {authView && (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <button
            type="button"
            className="auth-modal__backdrop"
            aria-label="Cerrar modal"
            onClick={closeModal}
          />
          <div className="auth-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__header">
              <h1 className="auth-modal__title">
                {authView === 'login'
                  ? 'Ingresá a tu cuenta'
                  : authView === 'register'
                    ? 'Crear cuenta'
                    : 'Recuperar contraseña'}
              </h1>
              <button
                type="button"
                className="auth-modal__close"
                aria-label="Cerrar modal"
                onClick={closeModal}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div id="auth-modal-title" className="sr-only">
              {authView === 'login'
                ? 'Ingresar'
                : authView === 'register'
                  ? 'Crear cuenta'
                  : 'Recuperar contraseña'}
            </div>
            {renderAuthContent()}
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/login" element={<PublicPage />} />
      <Route path="/registrarse" element={<PublicPage />} />
      <Route path="/recuperar-clave" element={<PublicPage />} />
      <Route element={<PrivateLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/puntos-venta" element={<PuntosVentaPage />} />
        <Route path="/comprobantes" element={<ComprobantesPage />} />
        <Route path="/comprobantes/carga-masiva" element={<ComprobantesCargaMasivaPage />} />
        <Route path="/emitir" element={<EmitirPage />} />
        <Route path="/configuracion" element={<ProfilePage />} />
        <Route path="/configuracion/planes" element={<PlanesPage />} />
        <Route element={<SuperuserOnlyRoute />}>
          <Route path="/admin/ops" element={<AdminOpsPage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
        </Route>
      </Route>
      <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
      <Route path="/terminos-condiciones" element={<TermsConditionsPage />} />
      <Route path="/ayuda" element={<HelpPage />} />
      <Route path="/eliminar-datos" element={<DataDeletionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
