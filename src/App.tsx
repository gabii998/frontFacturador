import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import PuntosVentaPage from './pages/PuntosVentaPage'
import ComprobantesPage from './pages/ComprobantesPage'
import ComprobantesCargaMasivaPage from './pages/ComprobantesCargaMasivaPage'
import EmitirPage from './pages/EmitirPage'
import ProfilePage from './pages/ProfilePage'
import PlanesPage from './pages/PlanesPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import DataDeletionPage from './pages/DataDeletionPage'
import HelpPage from './pages/HelpPage'
import { useAuth } from './contexts/AuthContext'
import SiteFooter from './components/SiteFooter'

function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileVisible, setMobileVisible] = useState(false)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const link = 'px-3 py-2 rounded-xl hover:bg-gray-100'
  const active = 'bg-blue-50 text-blue-700'

  const links = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/puntos-venta', label: 'Puntos de venta' },
    { to: '/comprobantes', label: 'Comprobantes' },
    { to: '/emitir', label: 'Emitir' },
    { to: '/configuracion', label: 'Configuración' }
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
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className={`absolute left-0 top-0 h-full w-[80%] max-w-sm bg-white flex flex-col rounded-r-3xl border-r border-slate-100 shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="relative overflow-hidden rounded-tr-3xl rounded-br-3xl">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-5 pb-8 pt-6 text-white shadow-inner">
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
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

function PublicLayout() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="auth-shell flex-1">
        <div className="flex w-full max-w-6xl flex-col gap-6 lg:grid lg:gap-12 lg:items-center lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="auth-hero">
            <span className="auth-hero__badge">Facturador</span>
            <h1 className="auth-hero__title">Controlá tu facturación sin fricción</h1>
            <p className="auth-hero__subtitle">
              Monitoreá puntos de venta, emití comprobantes y asegurá la validez de tus tokens desde un escritorio moderno.
            </p>
            <ul className="auth-hero__list">
              <li>Panel único para monitorear comprobantes emitidos</li>
              <li>Alertas y vencimientos de token gestionados automáticamente</li>
              <li>Experiencia rápida y responsive para todo tu equipo</li>
            </ul>
          </section>
          <div className="auth-card">
            <Outlet />
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrarse" element={<RegisterPage />} />
        <Route path="/recuperar-clave" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<PrivateLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/puntos-venta" element={<PuntosVentaPage />} />
        <Route path="/comprobantes" element={<ComprobantesPage />} />
        <Route path="/comprobantes/carga-masiva" element={<ComprobantesCargaMasivaPage />} />
        <Route path="/emitir" element={<EmitirPage />} />
        <Route path="/configuracion" element={<ProfilePage />} />
      <Route path="/configuracion/planes" element={<PlanesPage />} />
      </Route>
      <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
      <Route path="/terminos-condiciones" element={<TermsConditionsPage />} />
      <Route path="/ayuda" element={<HelpPage />} />
      <Route path="/eliminar-datos" element={<DataDeletionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
