import { useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import PuntosVentaPage from './pages/PuntosVentaPage'
import ComprobantesPage from './pages/ComprobantesPage'
import ComprobantesCargaMasivaPage from './pages/ComprobantesCargaMasivaPage'
import EmitirPage from './pages/EmitirPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { useAuth } from './contexts/AuthContext'

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
    <header className="bg-white border-b">
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
          <span className="font-bold text-lg">AFIP Frontend</span>
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
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-slate-900/60 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={closeMobileMenu}
          />
          <div className={`absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <span className="text-sm font-semibold text-slate-600">Menú</span>
              <button
                type="button"
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Cerrar menú"
                onClick={closeMobileMenu}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-5 py-5 text-sm text-slate-700">
              {links.map(({ to, label, end }) => (
                <NavLink
                  key={`mobile-${to}`}
                  to={to}
                  end={end}
                  className={({ isActive }) => `rounded-xl px-3 py-2 transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100'}`}
                  onClick={closeMobileMenu}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="mt-auto border-t px-5 py-5 text-sm text-slate-600">
                <div className="font-semibold text-slate-700">{user.name ?? user.email}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn w-full mt-4"
                >
                  Cerrar sesión
                </button>
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
      <main className="container-max py-6">
        <Outlet />
      </main>
    </div>
  )
}

function PublicLayout() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return (
    <div className="auth-shell">
      <div className="grid w-full max-w-6xl gap-12 items-center lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="auth-hero">
          <span className="auth-hero__badge">AFIP Frontend</span>
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
