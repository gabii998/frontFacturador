import { useEffect, useMemo, useState } from 'react'
import {
  IconArrowRight,
  IconBuildingBank,
  IconCheck,
  IconChecklist,
  IconCircleCheck,
  IconExternalLink,
  IconLogout,
  IconMessageCircle,
  IconRefresh,
  IconShieldCheck
} from '@tabler/icons-react'
import { Brand } from '../components/Brand'
import ErrorBox from '../components/ErrorBox'
import LoadingContent from '../components/LoadingContent'
import { useAuth } from '../contexts/AuthContext'
import type { ArcaPermissionWizardResponse, ArcaPermissionWizardStep } from '../models/arca'
import { ArcaPermissionService } from '../services/arcaPermission'

type WizardAction = 'start' | 'admin' | 'webservices' | 'delegated' | 'verify'

interface Props {
  initialState: ArcaPermissionWizardResponse | null
  loading?: boolean
  error?: unknown
  onStateChange: (next: ArcaPermissionWizardResponse) => void
  onRetry: () => void
}

export default function ArcaPermissionWizardPage({
  initialState,
  loading = false,
  error,
  onStateChange,
  onRetry
}: Props) {
  const { logout } = useAuth()
  const [action, setAction] = useState<WizardAction | null>(null)
  const [actionError, setActionError] = useState<unknown>(null)
  const wizard = useMemo(
    () => initialState ? normalizeWizardSteps(initialState) : null,
    [initialState]
  )

  const completedCount = useMemo(
    () => wizard?.steps.filter((step) => step.completed).length ?? 0,
    [wizard]
  )
  const activeStep = useMemo(
    () => wizard?.steps.find((step) => !step.completed) ?? wizard?.steps[wizard.steps.length - 1] ?? null,
    [wizard]
  )
  const activeStepIndex = useMemo(
    () => activeStep && wizard ? wizard.steps.findIndex((step) => step.key === activeStep.key) + 1 : 0,
    [activeStep, wizard]
  )

  const runAction = async (nextAction: WizardAction) => {
    setAction(nextAction)
    setActionError(null)
    try {
      const next =
        nextAction === 'start'
          ? await ArcaPermissionService.start()
          : nextAction === 'admin'
            ? await ArcaPermissionService.markAdminRelationsFound()
            : nextAction === 'webservices'
              ? await ArcaPermissionService.markWebservicesFound()
              : nextAction === 'delegated'
                ? await ArcaPermissionService.markDelegated()
                : await ArcaPermissionService.verify()
      onStateChange(next)
    } catch (err) {
      setActionError(err)
    } finally {
      setAction(null)
    }
  }

  const openArca = async () => {
    if (!wizard?.startedAt) {
      await runAction('start')
    }
    const target = wizard?.arcaLoginUrl ?? 'https://auth.afip.gob.ar/contribuyente_/login.xhtml'
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Brand />
          <button type="button" className="btn text-sm" onClick={logout}>
            <IconLogout className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 lg:py-10">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
                  <IconShieldCheck className="h-5 w-5" />
                  Autorización obligatoria
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">
                    Habilitá ARCA para usar la aplicación
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                    Necesitamos que autorices WSFE y padrón para poder consultar datos fiscales y emitir comprobantes con tu CUIT.
                  </p>
                </div>
              </div>
              {wizard && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Progreso</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950">
                    {completedCount}/{wizard.steps.length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {loading && <LoadingContent />}
          {Boolean(error) && !loading && (
            <div className="space-y-4">
              <ErrorBox error={error} />
              <button type="button" className="btn-primary" onClick={onRetry}>
                <IconRefresh className="h-4 w-4" />
                Reintentar
              </button>
            </div>
          )}

          {wizard && !loading && !error && (
            <>
              <AssistantPanel
                wizard={wizard}
                activeStep={activeStep}
                activeStepIndex={activeStepIndex}
                action={action}
                onOpenArca={openArca}
                onStart={() => runAction('start')}
                onAdminFound={() => runAction('admin')}
                onWebservicesFound={() => runAction('webservices')}
                onDelegated={() => runAction('delegated')}
                onVerify={() => runAction('verify')}
              />

              {Boolean(actionError) && <ErrorBox error={actionError} />}
              {Boolean(wizard.lastVerificationError) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  {wizard.lastVerificationError}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}

function normalizeWizardSteps(wizard: ArcaPermissionWizardResponse): ArcaPermissionWizardResponse {
  return {
    ...wizard,
    steps: buildCanonicalSteps(wizard)
  }
}

function buildCanonicalSteps(wizard: ArcaPermissionWizardResponse): ArcaPermissionWizardStep[] {
  const completedKeys = new Set(wizard.steps.filter((step) => step.completed).map((step) => step.key))
  const servicesLabel = wizard.requiredServices?.filter(Boolean).join(', ') || 'WSFE, ws_sr_padron_a13'
  const delegateCuit = wizard.delegateCuit || 'CUIT autorizado'
  const status = wizard.status
  const started = Boolean(wizard.startedAt) || completedKeys.has('login') || status !== 'NOT_STARTED'
  const adminFound =
    status === 'ADMIN_RELATIONS_FOUND' ||
    status === 'WEBSERVICES_FOUND' ||
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('admin')
  const webservicesFound =
    status === 'WEBSERVICES_FOUND' ||
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('webservices')
  const delegated =
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('delegate')
  const verified = status === 'VERIFIED' || completedKeys.has('verify')

  return [
    {
      key: 'login',
      title: 'Loguearse en ARCA',
      description: 'Ingresá con el CUIT emisor y tu clave fiscal.',
      actionLabel: 'Ir a ARCA',
      actionUrl: wizard.arcaLoginUrl,
      completed: started
    },
    {
      key: 'admin',
      title: 'Buscar el administrador de relaciones',
      description: 'Dentro de ARCA, buscá y abrí el administrador de relaciones.',
      actionLabel: 'Ver ayuda de ARCA',
      actionUrl: wizard.adminRelationsUrl,
      completed: adminFound
    },
    {
      key: 'webservices',
      title: 'Buscar los webservices',
      description: `Buscá los servicios que necesita el facturador: ${servicesLabel}.`,
      actionLabel: 'Ver ayuda de ARCA',
      actionUrl: wizard.adminRelationsUrl,
      completed: webservicesFound
    },
    {
      key: 'delegate',
      title: 'Autorizar los webservices',
      description: `Autorizá los servicios encontrados para el CUIT ${delegateCuit}.`,
      actionLabel: 'Ver ayuda de ARCA',
      actionUrl: wizard.adminRelationsUrl,
      completed: delegated
    },
    {
      key: 'confirm',
      title: 'Confirmar la autorización',
      description: 'Cuando ARCA muestre la relación activa, volvé al asistente y confirmá.',
      completed: delegated
    },
    {
      key: 'verify',
      title: 'Verificar permisos',
      description: 'Validamos WSFE y padrón contra ARCA antes de habilitar el panel.',
      completed: verified
    }
  ]
}

function getStepVisual(stepKey?: string, status?: string) {
  if (status === 'VERIFICATION_FAILED') {
    return {
      title: 'Revisión de permisos',
      description: 'El acceso suele fallar cuando falta uno de los servicios o la relación todavía no impactó.',
      icon: <IconRefresh className="h-5 w-5" />,
      imageUrl: '/illustrations/arca-wizard/error.png',
      items: [
        'Volvé a revisar el CUIT autorizado.',
        'Confirmá WSFE y ws_sr_padron_a13.',
        'Reintentá la verificación desde esta pantalla.'
      ]
    }
  }

  switch (stepKey) {
    case 'login':
      return {
        title: 'Ingreso a ARCA',
        description: 'El usuario debe entrar con su propia clave fiscal para autorizar la relación.',
        icon: <IconBuildingBank className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/01-login.png',
        items: [
          'Ingresar con CUIT y clave fiscal del emisor.',
          'Esperar a que ARCA muestre el panel principal.',
          'Volver a esta pantalla para avanzar al siguiente paso.'
        ]
      }
    case 'admin':
      return {
        title: 'Buscar el administrador de relaciones',
        description: 'Buscá el administrador de relaciones desde el panel de ARCA o desde el buscador interno.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/02-admin-relaciones.png',
        items: [
          'Abrir el buscador o menú de servicios de ARCA.',
          'Buscar “administrador de relaciones”.',
          'Entrar a esa opción.'
        ]
      }
    case 'delegate':
      return {
        title: 'Autorizar webservices',
        description: 'En esta etapa se asignan los servicios web encontrados a nuestro CUIT autorizado.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/04-autorizar-webservices.png',
        items: [
          'Crear o confirmar la relación nueva.',
          'Asignar el CUIT autorizado mostrado en datos.'
        ]
      }
    case 'webservices':
      return {
        title: 'Buscar webservices',
        description: 'Buscá los servicios web que necesita el facturador antes de asignarlos.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/03-buscar-webservices.png',
        items: [
          'Buscar WSFE.',
          'Buscar ws_sr_padron_a13.',
          'Dejar ambos servicios seleccionados o ubicados para autorizarlos.'
        ]
      }
    case 'confirm':
      return {
        title: 'Confirmación',
        description: 'Una vez que ARCA muestra la relación activa, volvés al asistente para continuar.',
        icon: <IconCheck className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/05-confirmar.png',
        items: [
          'Revisar que ambos servicios estén activos.',
          'Volver al facturador.',
          'Presionar “Ya delegué”.'
        ]
      }
    default:
      return {
        title: 'Verificación final',
        description: 'Probamos los permisos reales contra ARCA antes de permitir el uso del panel.',
        icon: <IconShieldCheck className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/06-verificar.png',
        items: [
          'Consultar puntos de venta por WSFE.',
          'Consultar datos fiscales por padrón.',
          'Habilitar el panel si ambos permisos responden.'
        ]
      }
  }
}

function AssistantPanel({
  wizard,
  activeStep,
  activeStepIndex,
  action,
  onOpenArca,
  onStart,
  onAdminFound,
  onWebservicesFound,
  onDelegated,
  onVerify
}: {
  wizard: ArcaPermissionWizardResponse
  activeStep: ArcaPermissionWizardStep | null
  activeStepIndex: number
  action: WizardAction | null
  onOpenArca: () => void
  onStart: () => void
  onAdminFound: () => void
  onWebservicesFound: () => void
  onDelegated: () => void
  onVerify: () => void
}) {
  const next = getAssistantNextStep(wizard, activeStep)
  const primary = getPrimaryAction(wizard, activeStep, action, onStart, onOpenArca, onAdminFound, onWebservicesFound, onDelegated, onVerify)

  return (
    <section className="rounded-lg border border-orange-200 bg-orange-50 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {wizard.steps.map((step, index) => (
          <span
            key={step.key}
            className={`h-2 flex-1 rounded-full ${step.completed ? 'bg-emerald-500' : index + 1 === activeStepIndex ? 'bg-orange-500' : 'bg-orange-100'}`}
            aria-label={`Paso ${index + 1}: ${step.title}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-700">
          <IconMessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-sm font-semibold text-orange-900">Asistente de autorización</p>
            {activeStep && (
              <p className="mt-1 text-xs font-semibold uppercase text-orange-700">
                Paso {activeStepIndex} de {wizard.steps.length}
              </p>
            )}
            <h2 className="mt-1 text-lg font-semibold leading-tight text-slate-950">{next.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{next.description}</p>
          </div>
          {next.items.length > 0 && (
            <ol className="space-y-2 text-sm leading-6 text-slate-700">
              {next.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}
          {activeStep && (
            <div className="rounded-lg border border-orange-200 bg-white/70 p-4">
              <WizardStepCard step={activeStep} index={activeStepIndex} active />
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" className="btn-primary" disabled={action !== null} onClick={primary.onClick}>
              {primary.icon}
              {primary.label}
            </button>
            {wizard.adminRelationsUrl && (
              <a className="btn justify-center bg-white" href={wizard.adminRelationsUrl} target="_blank" rel="noreferrer">
                <IconExternalLink className="h-4 w-4" />
                Ayuda de ARCA
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function getAssistantNextStep(wizard: ArcaPermissionWizardResponse, activeStep: ArcaPermissionWizardStep | null) {
  if (wizard.status === 'VERIFICATION_FAILED') {
    return {
      title: 'ARCA todavía no confirmó todos los permisos',
      description: 'Revisá que la relación esté aceptada para los servicios requeridos y volvé a verificar.',
      items: [
        'Confirmá que el CUIT autorizado sea exactamente el indicado en esta pantalla.',
        'Confirmá que estén delegados WSFE y ws_sr_padron_a13.',
        'Si acabás de delegar, esperá unos minutos y ejecutá la verificación nuevamente.'
      ]
    }
  }

  switch (activeStep?.key) {
    case 'login':
      return {
        title: 'Primero ingresá a ARCA',
        description: 'Abrí ARCA en otra pestaña e ingresá con la clave fiscal del CUIT emisor.',
        items: [
          'Usá el CUIT que figura como emisor.',
          'Completá CUIT, clave fiscal y cualquier validación que pida ARCA.',
          'Cuando veas el panel principal, volvé a este asistente.'
        ]
      }
    case 'admin':
      return {
        title: 'Buscar el administrador de relaciones',
        description: 'Ahora necesitás ubicar la herramienta donde ARCA permite delegar servicios.',
        items: [
          'Usá el buscador o menú de servicios.',
          'Buscá “administrador de relaciones”.',
          'Cuando lo abras, volvé y continuá.'
        ]
      }
    case 'delegate':
      return {
        title: 'Autorizá los servicios encontrados',
        description: 'Ahora asigná WSFE y padrón al CUIT autorizado que aparece en esta pantalla.',
        items: [
          'Seleccioná los servicios encontrados.',
          'Ingresá o confirmá el CUIT autorizado.',
          'Guardá la relación en ARCA.'
        ]
      }
    case 'webservices':
      return {
        title: 'Buscá los webservices',
        description: 'Dentro del Administrador de Relaciones, buscá los servicios que necesita el facturador.',
        items: [
          'Buscá WSFE para factura electrónica.',
          'Buscá ws_sr_padron_a13 para padrón.',
          'Cuando los tengas ubicados, volvé y continuá.'
        ]
      }
    case 'confirm':
      return {
        title: 'Confirmá la delegación',
        description: 'Cuando ARCA muestre la relación activa, marcá este paso como completado.',
        items: [
          'La relación debe quedar aceptada o activa en ARCA.',
          'No cierres sesión hasta terminar la verificación.',
          'Después de confirmar, ejecutá la verificación desde esta pantalla.'
        ]
      }
    default:
      return {
        title: 'Verificá el acceso',
        description: 'Vamos a probar los permisos reales contra ARCA antes de liberar el panel.',
        items: [
          'Se consulta WSFE para validar puntos de venta.',
          'Se consulta padrón para validar datos fiscales.',
          'Si ambas llamadas responden, el acceso queda habilitado.'
        ]
      }
  }
}

function getPrimaryAction(
  wizard: ArcaPermissionWizardResponse,
  activeStep: ArcaPermissionWizardStep | null,
  action: WizardAction | null,
  onStart: () => void,
  onOpenArca: () => void,
  onAdminFound: () => void,
  onWebservicesFound: () => void,
  onDelegated: () => void,
  onVerify: () => void
) {
  if (!wizard.startedAt) {
    return { label: 'Ir a ARCA', onClick: onOpenArca, icon: <IconExternalLink className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'login') {
    return { label: 'Ir a ARCA', onClick: onOpenArca, icon: <IconExternalLink className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'admin') {
    return { label: 'Ya encontré el administrador de relaciones', onClick: onAdminFound, icon: <IconArrowRight className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'webservices') {
    return { label: 'Ya encontré los webservices', onClick: onWebservicesFound, icon: <IconArrowRight className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'delegate') {
    return { label: 'Ya autoricé los webservices', onClick: onDelegated, icon: <IconCheck className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'confirm') {
    return { label: 'Ya delegué', onClick: onDelegated, icon: <IconCheck className="h-4 w-4" /> }
  }
  return {
    label: 'Verificar permiso',
    onClick: onVerify,
    icon: <IconRefresh className={`h-4 w-4 ${action === 'verify' ? 'animate-spin' : ''}`} />
  }
}

function WizardStepCard({ step, index, active }: { step: ArcaPermissionWizardStep; index: number; active: boolean }) {
  return (
    <article className={`flex gap-4 rounded-lg border bg-white p-4 ${active ? 'border-orange-300 shadow-sm shadow-orange-100' : 'border-slate-200'}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${step.completed ? 'bg-emerald-50 text-emerald-700' : active ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
        {step.completed ? <IconCircleCheck className="h-5 w-5" /> : <span className="text-sm font-semibold">{index}</span>}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-slate-950">{step.title}</h2>
          {active && <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">Ahora</span>}
        </div>
        <p className="text-sm leading-6 text-slate-600">{step.description}</p>
        {active && <StepCapture step={step} />}
        {step.actionUrl && (
          <a
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800"
            href={step.actionUrl}
            target="_blank"
            rel="noreferrer"
          >
            {step.actionLabel ?? 'Abrir enlace'}
            <IconExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  )
}

function StepCapture({ step }: { step: ArcaPermissionWizardStep }) {
  const visual = getStepVisual(step.key)
  const [imageUnavailable, setImageUnavailable] = useState(false)

  useEffect(() => {
    setImageUnavailable(false)
  }, [visual.imageUrl])

  if (!visual.imageUrl || imageUnavailable) {
    return null
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <img
        src={visual.imageUrl}
        alt={visual.title}
        className="aspect-video w-full object-cover"
        onError={() => setImageUnavailable(true)}
      />
    </div>
  )
}
