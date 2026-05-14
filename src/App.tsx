import { ReactNode, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import NotificationsPage from './pages/NotificationsPage'
import PuntosVentaPage from './pages/PuntosVentaPage'
import ComprobantesPage from './pages/ComprobantesPage'
import ComprobantesCargaMasivaPage from './pages/ComprobantesCargaMasivaPage'
import EmitirPage from './pages/EmitirPage'
import ProfilePage from './pages/ProfilePage'
import PlanesPage from './pages/PlanesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminOpsPage from './pages/AdminOpsPage'
import AdminMailPage from './pages/AdminMailPage'
import AdminBillingQueuePage from './pages/AdminBillingQueuePage'
import AdminNotificationsPage from './pages/AdminNotificationsPage'
import AdminWhatsAppPage from './pages/AdminWhatsAppPage'
import AdminPlansPage from './pages/AdminPlansPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import DataDeletionPage from './pages/DataDeletionPage'
import HelpPage from './pages/HelpPage'
import ArcaPermissionWizardPage from './pages/ArcaPermissionWizardPage'
import { useAuth } from './contexts/AuthContext'
import SiteFooter from './components/SiteFooter'
import { PLAN_DETAILS } from './constants/planes'
import { Brand } from './components/Brand'
import HeroProcessIllustration from './components/HeroProcessIllustration'
import { PrivateTopbarActionsProvider } from './contexts/PrivateTopbarContext'
import { IconAlertCircle, IconAlertTriangle, IconChevronLeft, IconChevronRight, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { ArcaPermissionService } from './services/arcaPermission'
import type { ArcaPermissionWizardResponse } from './models/arca'
import { NotificationService, type NotificationItem } from './services/notifications'

const LANDING_FEATURES = [
  {
    title: 'Facturas por whatsapp',
    text: 'Emisión desde conversaciones operativas, sin sacar al usuario de su flujo habitual.',
    image: '/illustrations/features/feature-whatsapp.png'
  },
  {
    title: 'Facturas cuando arca este offline',
    text: 'La operación sigue disponible aun cuando el servicio externo no responde en tiempo real.',
    image: '/illustrations/features/feature-offline.png'
  },
  {
    title: 'Generacion de pdfs',
    text: 'Comprobantes listos para compartir, descargar y conservar dentro del circuito administrativo.',
    image: '/illustrations/features/feature-pdf.png'
  },
  {
    title: 'Accesible desde cualquier dispositivo',
    text: 'La operación acompaña al usuario en escritorio, tablet o móvil sin cambiar de flujo de trabajo.',
    image: '/illustrations/features/feature-devices.png'
  }
] as const

function getPrivateSection(pathname: string) {
  const sections = [
    {
      match: (path: string) => path === '/dashboard',
      title: 'Dashboard',
      subtitle: 'Resumen operativo y estado general de tu facturación.'
    },
    {
      match: (path: string) => path.startsWith('/puntos-venta'),
      title: 'Puntos de venta',
      subtitle: 'Consultá y administrá los puntos habilitados para emitir.'
    },
    {
      match: (path: string) => path.startsWith('/comprobantes/carga-masiva'),
      title: 'Carga masiva',
      subtitle: 'Importá comprobantes desde archivos y revisá el resultado.'
    },
    {
      match: (path: string) => path.startsWith('/comprobantes'),
      title: 'Comprobantes',
      subtitle: 'Buscá, revisá y descargá comprobantes emitidos.'
    },
    {
      match: (path: string) => path.startsWith('/emitir'),
      title: 'Emitir',
      subtitle: 'Generá comprobantes y prepará la documentación asociada.'
    },
    {
      match: (path: string) => path.startsWith('/notificaciones'),
      title: 'Notificaciones',
      subtitle: 'Avisos del sistema, pendientes y confirmaciones recientes.'
    },
    {
      match: (path: string) => path.startsWith('/configuracion/planes'),
      title: 'Planes',
      subtitle: 'Gestioná tu suscripción y el alcance de tu cuenta.'
    },
    {
      match: (path: string) => path.startsWith('/configuracion'),
      title: 'Configuración',
      subtitle: 'Administrá datos de cuenta, emisor y seguridad.'
    },
    {
      match: (path: string) => path.startsWith('/admin/ops'),
      title: 'Ops',
      subtitle: 'Monitoreo técnico y métricas operativas.'
    },
    {
      match: (path: string) => path.startsWith('/admin/notificaciones'),
      title: 'Notificaciones',
      subtitle: 'Monitoreo y recuperación de la cola de notificaciones.'
    },
    {
      match: (path: string) => path.startsWith('/admin/whatsapp'),
      title: 'WhatsApp admin',
      subtitle: 'Auditoría de conversaciones y respuestas operativas.'
    },
    {
      match: (path: string) => path.startsWith('/admin/mail'),
      title: 'Mail',
      subtitle: 'Monitoreo y recuperación de la cola de emails.'
    },
    {
      match: (path: string) => path.startsWith('/admin/facturacion'),
      title: 'Facturación admin',
      subtitle: 'Monitoreo de la cola de emisión de comprobantes.'
    },
    {
      match: (path: string) => path.startsWith('/admin/planes'),
      title: 'Planes admin',
      subtitle: 'Alta y baja de planes disponibles.'
    },
    {
      match: (path: string) => path.startsWith('/admin/usuarios'),
      title: 'Superusuario',
      subtitle: 'Gestión de usuarios, roles y permisos.'
    }
  ]

  return sections.find(({ match }) => match(pathname)) ?? sections[0]
}

function Navbar({ mobileTitle, mobileActions }: { mobileTitle: string; mobileActions: ReactNode | null }) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileVisible, setMobileVisible] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const link = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-700'
  const active = 'bg-orange-50 text-orange-700'

  const links = [
    { to: '/dashboard', label: 'Dashboard', end: true },
    { to: '/notificaciones', label: 'Notificaciones' },
    { to: '/puntos-venta', label: 'Puntos de venta' },
    { to: '/comprobantes', label: 'Comprobantes' },
    { to: '/emitir', label: 'Emitir' },
    { to: '/configuracion', label: 'Configuración' },
    ...(user?.role === 'SUPERUSER'
      ? [
          { to: '/admin/ops', label: 'Ops' },
          { to: '/admin/notificaciones', label: 'Notificaciones' },
          { to: '/admin/whatsapp', label: 'WhatsApp' },
          { to: '/admin/mail', label: 'Mail' },
          { to: '/admin/facturacion', label: 'Facturación' },
          { to: '/admin/planes', label: 'Planes' },
          { to: '/admin/usuarios', label: 'Superusuario' }
        ]
      : [])
  ]

  useEffect(() => () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
  }, [])

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0)
      return
    }

    let cancelled = false

    const loadUnread = async () => {
      try {
        const stats = await NotificationService.stats()
        if (!cancelled) {
          setUnreadNotifications(stats.unread)
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0)
        }
      }
    }

    void loadUnread()
    const interval = window.setInterval(() => {
      void loadUnread()
    }, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [user])

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

  const renderNav = (closeOnClick = false) => (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `${link} ${isActive ? active : ''}`}
          onClick={closeOnClick ? closeMobileMenu : undefined}
        >
          <span className="sidebar-link__content">
            <span>{label}</span>
            {to === '/notificaciones' && unreadNotifications > 0 && (
              <span className="sidebar-link__badge">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 md:flex">
        <div className="mb-8">
          <Brand />
        </div>
        {renderNav()}
        <div className="mt-auto space-y-4 border-t border-slate-200 pt-5 text-sm">
          {user && (
            <div className="text-slate-600">
              <div className="font-medium text-slate-900">{user.name ?? user.email}</div>
              <div className="mt-1 break-all text-xs">{user.email}</div>
            </div>
          )}
          <button onClick={handleLogout} className="btn w-full justify-center text-sm">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="mobile-appbar">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="mobile-appbar__menu"
            aria-label="Abrir menú"
            onClick={openMobileMenu}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <h1 className="mobile-appbar__title">{mobileTitle}</h1>
          {mobileActions ? (
            <div className="mobile-appbar__actions">
              {mobileActions}
            </div>
          ) : (
            <span className="h-10 w-10" aria-hidden="true" />
          )}
        </div>
      </header>

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
            <div className="flex flex-col gap-2 px-5 py-6 text-sm text-slate-700">
              {renderNav(true)}
            </div>
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
    </>
  )
}

function PrivateLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [topbarActions, setTopbarActions] = useState<ReactNode | null>(null)
  const [wizard, setWizard] = useState<ArcaPermissionWizardResponse | null>(null)
  const [wizardLoading, setWizardLoading] = useState(true)
  const [wizardError, setWizardError] = useState<unknown>(null)
  const section = getPrivateSection(location.pathname)

  const loadWizard = () => {
    setWizardLoading(true)
    setWizardError(null)
    ArcaPermissionService.get()
      .then(setWizard)
      .catch(setWizardError)
      .finally(() => setWizardLoading(false))
  }

  useEffect(() => {
    setTopbarActions(null)
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthenticated) {
      setWizard(null)
      setWizardError(null)
      setWizardLoading(false)
      return
    }
    loadWizard()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (wizardLoading || wizardError || !wizard?.canEmit) {
    return (
      <ArcaPermissionWizardPage
        initialState={wizard}
        loading={wizardLoading}
        error={wizardError}
        onStateChange={setWizard}
        onRetry={loadWizard}
      />
    )
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar mobileTitle={section.title} mobileActions={topbarActions} />
      <main className="flex-1 px-4 pb-6 pt-16 md:ml-72 md:px-8 md:pb-8 md:pt-0">
        <PrivateTopbarActionsProvider setActions={setTopbarActions}>
          <PrivateTopbar pathname={location.pathname} actions={topbarActions} />
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </PrivateTopbarActionsProvider>
      </main>
      <NotificationToaster />
    </div>
  )
}

function PrivateTopbar({ pathname, actions }: { pathname: string; actions: ReactNode | null }) {
  const section = getPrivateSection(pathname)

  return (
    <header className={`private-topbar ${actions ? 'private-topbar--with-actions' : ''}`}>
      <div className="private-topbar__heading">
        <h1 className="private-topbar__title">{section.title}</h1>
        <p className="private-topbar__subtitle">{section.subtitle}</p>
      </div>
      {actions && (
        <div className="private-topbar__actions">
          {actions}
        </div>
      )}
    </header>
  )
}

type ActiveToast = {
  id: string
  item: NotificationItem
}

function notificationToastToneClass(type: NotificationItem['type']) {
  switch (type) {
    case 'SUCCESS':
      return 'notification-toast__icon--success'
    case 'WARNING':
      return 'notification-toast__icon--warning'
    case 'ERROR':
      return 'notification-toast__icon--error'
    default:
      return 'notification-toast__icon--info'
  }
}

function NotificationToastIcon({ type }: { type: NotificationItem['type'] }) {
  switch (type) {
    case 'SUCCESS':
      return <IconCircleCheck />
    case 'WARNING':
      return <IconAlertTriangle />
    case 'ERROR':
      return <IconAlertCircle />
    default:
      return <IconInfoCircle />
  }
}

function NotificationToaster() {
  const navigate = useNavigate()
  const [toasts, setToasts] = useState<ActiveToast[]>([])
  const initializedRef = useRef(false)
  const knownUnreadIdsRef = useRef<Set<string>>(new Set())
  const toastTimersRef = useRef<Map<string, number>>(new Map())

  const removeToast = (id: string) => {
    const timer = toastTimersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      toastTimersRef.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const enqueueToast = (item: NotificationItem) => {
    setToasts((current) => {
      if (current.some((toast) => toast.id === item.id)) {
        return current
      }
      return [{ id: item.id, item }, ...current].slice(0, 3)
    })

    const existingTimer = toastTimersRef.current.get(item.id)
    if (existingTimer) {
      window.clearTimeout(existingTimer)
    }
    const timer = window.setTimeout(() => {
      toastTimersRef.current.delete(item.id)
      setToasts((current) => current.filter((toast) => toast.id !== item.id))
    }, 7000)
    toastTimersRef.current.set(item.id, timer)
  }

  useEffect(() => {
    let cancelled = false

    const pollNotifications = async () => {
      try {
        const response = await NotificationService.list(0, 10, false)
        if (cancelled) return

        const unreadIds = new Set(
          response.items
            .filter((item) => !item.readAt)
            .map((item) => item.id)
        )

        if (!initializedRef.current) {
          knownUnreadIdsRef.current = unreadIds
          initializedRef.current = true
          return
        }

        response.items
          .filter((item) => !item.readAt && !knownUnreadIdsRef.current.has(item.id))
          .forEach((item) => enqueueToast(item))

        knownUnreadIdsRef.current = unreadIds
      } catch {
        return
      }
    }

    void pollNotifications()
    const interval = window.setInterval(() => {
      void pollNotifications()
    }, 15000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      toastTimersRef.current.clear()
    }
  }, [])

  const handleToastClick = async (toast: ActiveToast) => {
    if (!toast.item.readAt) {
      await NotificationService.markAsRead(toast.item.id).catch(() => undefined)
    }
    knownUnreadIdsRef.current.delete(toast.item.id)
    removeToast(toast.id)
    navigate(toast.item.actionUrl || '/notificaciones')
  }

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="notification-toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`notification-toast notification-toast--${toast.item.type.toLowerCase()}`}
        >
          <button
            type="button"
            className="notification-toast__body"
            onClick={() => void handleToastClick(toast)}
          >
            <div className="notification-toast__layout">
              <div className="notification-toast__icon-col">
                <span className={`notification-toast__icon ${notificationToastToneClass(toast.item.type)}`}>
                  <NotificationToastIcon type={toast.item.type} />
                </span>
              </div>
              <div className="notification-toast__text">
                <strong>{toast.item.title}</strong>
                <p>{toast.item.body}</p>
              </div>
            </div>
          </button>
          <button
            type="button"
            className="notification-toast__close"
            aria-label="Cerrar notificación"
            onClick={() => removeToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
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

function RootRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <PublicPage />
}

function PublicPage() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const landingPageRef = useRef<HTMLDivElement | null>(null)
  const [showToolbarBrand, setShowToolbarBrand] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [activePlan, setActivePlan] = useState(0)

  const authView =
    location.pathname === '/login'
      ? 'login'
      : location.pathname === '/registrarse'
        ? 'register'
        : location.pathname === '/recuperar-clave'
          ? 'forgot-password'
          : null
  const [renderedAuthView, setRenderedAuthView] = useState<typeof authView>(authView)
  const [authModalClosing, setAuthModalClosing] = useState(false)

  useEffect(() => {
    if (authView) {
      setRenderedAuthView(authView)
      setAuthModalClosing(false)
      return undefined
    }

    if (!renderedAuthView) {
      return undefined
    }

    setAuthModalClosing(true)
    const timeout = window.setTimeout(() => {
      setRenderedAuthView(null)
      setAuthModalClosing(false)
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [authView, renderedAuthView])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleLandingScroll = () => {
    const target = landingPageRef.current
    if (!target) return
    setShowToolbarBrand(target.scrollTop >= target.clientHeight - 120)
  }

  const showPreviousFeature = () => {
    setActiveFeature(prev => (prev === 0 ? LANDING_FEATURES.length - 1 : prev - 1))
  }

  const showNextFeature = () => {
    setActiveFeature(prev => (prev + 1) % LANDING_FEATURES.length)
  }

  const showPreviousPlan = () => {
    setActivePlan(prev => (prev === 0 ? PLAN_DETAILS.length - 1 : prev - 1))
  }

  const showNextPlan = () => {
    setActivePlan(prev => (prev + 1) % PLAN_DETAILS.length)
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveFeature(prev => (prev + 1) % LANDING_FEATURES.length)
    }, 4200)
    return () => window.clearInterval(interval)
  }, [])

  const closeModal = () => {
    navigate('/', { replace: true })
  }

  const renderAuthContent = () => {
    switch (renderedAuthView) {
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
    <div
      ref={landingPageRef}
      onScroll={handleLandingScroll}
      className="landing-page min-h-screen flex flex-col bg-white text-slate-900"
    >
      <header className={`landing-toolbar ${showToolbarBrand ? 'landing-toolbar--brand-visible' : ''}`}>
        <div className="landing-toolbar__brand-slot">
          <Brand/>
        </div>
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
      <main className="landing-shell flex-1">
        <section className="landing-snap-section landing-first-section">
          <div className="landing-hero landing-hero--centered">
            <div className="landing-hero__content landing-hero__content--centered">
              <div className="landing-hero__brand">
                <Brand />
              </div>
              <h1 className="landing-hero__title">Facturación clara, directa y en un solo lugar.</h1>
              <p className="landing-hero__subtitle">
                Centralizá emisión, consulta de comprobantes y seguimiento operativo sin depender de una pantalla recargada.
              </p>
              <div className="landing-hero__illustration" aria-hidden="true">
                <HeroProcessIllustration />
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
            <div className="landing-feature-carousel">
              <button
                type="button"
                className="landing-feature-carousel__control"
                aria-label="Función anterior"
                onClick={showPreviousFeature}
              >
                <IconChevronLeft />
              </button>
              <article className="landing-feature-item" key={LANDING_FEATURES[activeFeature].title}>
                <div className="landing-feature-item__media" aria-hidden="true">
                  <img
                    src={LANDING_FEATURES[activeFeature].image}
                    alt=""
                    className="landing-feature-item__image"
                  />
                </div>
                <div className="landing-feature-item__content">
                  <h2 className="landing-feature-item__title">{LANDING_FEATURES[activeFeature].title}</h2>
                  <p className="landing-feature-item__text">
                    {LANDING_FEATURES[activeFeature].text}
                  </p>
                </div>
              </article>
              <button
                type="button"
                className="landing-feature-carousel__control"
                aria-label="Función siguiente"
                onClick={showNextFeature}
              >
                <IconChevronRight />
              </button>
            </div>
            <div className="landing-feature-carousel__dots" aria-label="Seleccionar función">
              {LANDING_FEATURES.map((feature, index) => (
                <button
                  key={feature.title}
                  type="button"
                  className={index === activeFeature ? 'is-active' : undefined}
                  aria-label={`Ver ${feature.title}`}
                  onClick={() => setActiveFeature(index)}
                />
              ))}
            </div>
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
              <PlanCard key={plan.code} plan={plan} />
            ))}
          </div>
          <div className="landing-pricing-carousel">
            <button
              type="button"
              className="landing-pricing-carousel__control"
              aria-label="Plan anterior"
              onClick={showPreviousPlan}
            >
              <IconChevronLeft />
            </button>
            <PlanCard plan={PLAN_DETAILS[activePlan]} />
            <button
              type="button"
              className="landing-pricing-carousel__control"
              aria-label="Plan siguiente"
              onClick={showNextPlan}
            >
              <IconChevronRight />
            </button>
          </div>
          <div className="landing-pricing-carousel__dots" aria-label="Seleccionar plan">
            {PLAN_DETAILS.map((plan, index) => (
              <button
                key={plan.code}
                type="button"
                className={index === activePlan ? 'is-active' : undefined}
                aria-label={`Ver plan ${plan.name}`}
                onClick={() => setActivePlan(index)}
              />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      {renderedAuthView && (
        <div
          className={`auth-modal ${authModalClosing ? 'auth-modal--closing' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <button
            type="button"
            className="auth-modal__backdrop"
            aria-label="Cerrar modal"
            onClick={closeModal}
          />
          <div className="auth-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="auth-modal__header">
              <h1 className="auth-modal__title">
                {renderedAuthView === 'login'
                  ? 'Ingresá a tu cuenta'
                  : renderedAuthView === 'register'
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
              {renderedAuthView === 'login'
                ? 'Ingresar'
                : renderedAuthView === 'register'
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

function PlanCard({ plan }: { plan: typeof PLAN_DETAILS[number] }) {
  return (
    <article className={`landing-plan ${plan.highlighted ? 'landing-plan--highlighted' : ''}`}>
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
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<PublicPage />} />
      <Route path="/registrarse" element={<PublicPage />} />
      <Route path="/recuperar-clave" element={<PublicPage />} />
      <Route element={<PrivateLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/notificaciones" element={<NotificationsPage />} />
        <Route path="/puntos-venta" element={<PuntosVentaPage />} />
        <Route path="/comprobantes" element={<ComprobantesPage />} />
        <Route path="/comprobantes/carga-masiva" element={<ComprobantesCargaMasivaPage />} />
        <Route path="/emitir" element={<EmitirPage />} />
        <Route path="/configuracion" element={<ProfilePage />} />
        <Route path="/configuracion/planes" element={<PlanesPage />} />
        <Route element={<SuperuserOnlyRoute />}>
          <Route path="/admin/ops" element={<AdminOpsPage />} />
          <Route path="/admin/notificaciones" element={<AdminNotificationsPage />} />
          <Route path="/admin/whatsapp" element={<AdminWhatsAppPage />} />
          <Route path="/admin/mail" element={<AdminMailPage />} />
          <Route path="/admin/facturacion" element={<AdminBillingQueuePage />} />
          <Route path="/admin/planes" element={<AdminPlansPage />} />
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
