import { Suspense, lazy } from 'react'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonNote,
  IonTitle,
  IonToolbar
} from '@ionic/react'
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import SiteFooter from './components/SiteFooter'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PuntosVentaPage = lazy(() => import('./pages/PuntosVentaPage'))
const ComprobantesPage = lazy(() => import('./pages/ComprobantesPage'))
const ComprobantesCargaMasivaPage = lazy(() => import('./pages/ComprobantesCargaMasivaPage'))
const EmitirPage = lazy(() => import('./pages/EmitirPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PlanesPage = lazy(() => import('./pages/PlanesPage'))
const LoginPage = lazy(() => import('./pages/login/LoginPage'))
const RegisterPage = lazy(() => import('./pages/register/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'))
const DataDeletionPage = lazy(() => import('./pages/DataDeletionPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))

type NavItem = {
  to: string
  label: string
  end?: boolean
}

const LINKS: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/puntos-venta', label: 'Puntos de venta' },
  { to: '/comprobantes', label: 'Comprobantes' },
  { to: '/emitir', label: 'Emitir' },
  { to: '/configuracion', label: 'Configuracion' }
]

function Navbar() {
  const { user, logout } = useAuth()
  const link = 'rounded-xl px-3 py-2 hover:bg-gray-100'
  const active = 'bg-blue-50 text-blue-700'

  return (
    <IonHeader className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white md:static md:top-auto">
      <IonToolbar className="container-max">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <IonMenuButton
              menu="private-menu"
              className="md:hidden"
              autoHide={false}
              aria-label="Abrir menu"
            />
            <span className="text-lg font-bold">Facturador</span>
            <nav className="hidden gap-1 md:flex">
              {LINKS.map(({ to, label, end }) => (
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

          <div className="hidden items-center gap-3 text-sm md:flex">
            {user && (
              <div className="text-right text-gray-600">
                <div className="font-medium text-gray-800">{user.name ?? user.email}</div>
                <div className="text-xs">{user.email}</div>
              </div>
            )}
            <IonButton size="small" fill="outline" onClick={() => void logout()}>
              Cerrar sesion
            </IonButton>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  )
}

function PrivateMenu() {
  const { user, logout } = useAuth()

  return (
    <IonMenu menuId="private-menu" contentId="private-layout-content" side="start" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Facturador</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {user && (
          <div className="border-b border-slate-200 px-4 py-4">
            <p className="font-semibold text-slate-800">{user.name ?? user.email}</p>
            <IonNote>{user.email}</IonNote>
          </div>
        )}
        <IonList>
          {LINKS.map(({ to, label }) => (
            <IonMenuToggle key={`menu-${to}`} autoHide>
              <IonItem button detail={false} routerLink={to} routerDirection="root">
                <IonLabel>{label}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
        <div className="px-4 py-4">
          <IonButton expand="block" fill="outline" onClick={() => void logout()}>
            Cerrar sesion
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>
  )
}

function PrivateLayout() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return (
    <>
      <PrivateMenu />
      <div id="private-layout-content" className="min-h-screen flex flex-col">
        <Navbar />
        <IonContent>
          <Outlet />
        </IonContent>
        <SiteFooter />
      </div>
    </>
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
        <div className="flex w-full max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-12">
          <section className="auth-hero">
            <span className="auth-hero__badge">Facturador</span>
            <h1 className="auth-hero__title">Controla tu facturacion sin friccion</h1>
            <p className="auth-hero__subtitle">
              Monitorea puntos de venta, emiti comprobantes y asegura la validez de tus tokens desde un escritorio moderno.
            </p>
            <ul className="auth-hero__list">
              <li>Panel unico para monitorear comprobantes emitidos</li>
              <li>Alertas y vencimientos de token gestionados automaticamente</li>
              <li>Experiencia rapida y responsive para todo tu equipo</li>
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
    <Suspense fallback={<div className="container-max body-copy-muted py-8">Cargando...</div>}>
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
    </Suspense>
  )
}
