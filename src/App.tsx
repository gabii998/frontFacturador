import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import PuntosVentaPage from './pages/PuntosVentaPage'
import ComprobantesPage from './pages/ComprobantesPage'
import EmitirPage from './pages/EmitirPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import { useAuth } from './contexts/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const link = 'px-3 py-2 rounded-xl hover:bg-gray-100'
  const active = 'bg-blue-50 text-blue-700'

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white border-b">
      <div className="container-max flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">AFIP Frontend</span>
          <nav className="flex gap-1">
            <NavLink to="/" className={({ isActive }) => `${link} ${isActive ? active : ''}`} end>
              Dashboard
            </NavLink>
            <NavLink to="/puntos-venta" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              Puntos de venta
            </NavLink>
            <NavLink to="/comprobantes" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              Comprobantes
            </NavLink>
            <NavLink to="/emitir" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>
              Emitir
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
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
        <Route path="/emitir" element={<EmitirPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
