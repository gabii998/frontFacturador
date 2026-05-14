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

type WizardAction = 'start' | 'admin' | 'webservices' | 'authorized' | 'delegated' | 'verify'

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
              : nextAction === 'authorized'
                ? await ArcaPermissionService.markAuthorizedCuitDefined()
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
                onAuthorizedCuitDefined={() => runAction('authorized')}
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
  const servicesLabel = wizard.requiredServices?.filter(Boolean).join(', ') || 'wsfe, ws_sr_padron_a13'
  const delegateCuit = wizard.delegateCuit || 'CUIT autorizado'
  const status = wizard.status
  const started = Boolean(wizard.startedAt) || completedKeys.has('login') || status !== 'NOT_STARTED'
  const adminFound =
    status === 'ADMIN_RELATIONS_FOUND' ||
    status === 'WEBSERVICES_FOUND' ||
    status === 'AUTHORIZED_CUIT_DEFINED' ||
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('admin')
  const webservicesFound =
    status === 'WEBSERVICES_FOUND' ||
    status === 'AUTHORIZED_CUIT_DEFINED' ||
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('webservices')
  const authorizedCuitDefined =
    status === 'AUTHORIZED_CUIT_DEFINED' ||
    status === 'WAITING_VERIFICATION' ||
    status === 'VERIFICATION_FAILED' ||
    status === 'VERIFIED' ||
    completedKeys.has('delegate')
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
      description: 'Ingresá con tu CUIT y clave fiscal.',
      completed: started
    },
    {
      key: 'admin',
      title: 'Buscar el administrador de relaciones',
      description: 'Buscá y abrí Administrador de Relaciones desde el menú o el buscador de ARCA.',
      completed: adminFound
    },
    {
      key: 'webservices',
      title: 'Buscar los webservices',
      description: `En “Nueva Relación”, buscá WebServices y seleccioná cada servicio requerido: ${servicesLabel}.`,
      completed: webservicesFound
    },
    {
      key: 'delegate',
      title: 'Cargar el CUIT autorizado',
      description: `En la selección del representante, cargá el CUIT ${delegateCuit} como autorizado.`,
      completed: authorizedCuitDefined
    },
    {
      key: 'confirm',
      title: 'Confirmar la delegación',
      description: 'Revisá la relación, confirmala en ARCA y dejala lista para validación.',
      completed: delegated
    },
    {
      key: 'verify',
      title: 'Verificar permisos',
      description: 'Probamos WSFE y padrón en ARCA antes de habilitar el panel.',
      completed: verified
    }
  ]
}

function getStepVisual(stepKey?: string, status?: string) {
  if (status === 'VERIFICATION_FAILED') {
    return {
      title: 'Revisión de permisos',
      description: 'Si ARCA todavía no responde, suele faltar un servicio, la aceptación del autorizado o tiempo de propagación.',
      icon: <IconRefresh className="h-5 w-5" />,
      imageUrl: '/illustrations/arca-wizard/pdf/page-11.png',
      items: [
        'Revisá que el CUIT autorizado sea el correcto.',
        'Confirmá que repetiste la relación para todos los servicios requeridos.',
        'Si ARCA muestra pendientes de aceptación, completalos antes de verificar.',
        'Esperá unos minutos y volvé a verificar.'
      ]
    }
  }

  switch (stepKey) {
    case 'login':
      return {
        title: 'Ingresar con clave fiscal',
        description: 'El instructivo oficial arranca con el ingreso del contribuyente que va a delegar los servicios.',
        icon: <IconBuildingBank className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/login.png',
        items: [
          'Entrá con el CUIT emisor y su clave fiscal.',
          'Esperá a ver el panel principal de ARCA.',
          'Volvé al asistente para seguir.'
        ]
      }
    case 'admin':
      return {
        title: 'Buscar el administrador de relaciones',
        description: 'El PDF muestra este paso con el acceso al servicio Administrador de Relaciones.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/relaciones.png',
        items: [
          'Abrí el buscador o el listado de servicios.',
          'Buscá “Administrador de Relaciones”.',
          'Entrá al servicio.'
        ]
      }
    case 'webservices':
      return {
        title: 'Nueva relación y búsqueda del servicio',
        description: 'El instructivo oficial usa “Nueva Relación”, entra a WebServices y selecciona Facturación Electrónica como ejemplo.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/pdf/page-07.png',
        items: [
          'Entrá por “Nueva Relación”.',
          'Buscá la agrupación WebServices.',
          'Seleccioná un servicio requerido.',
          'Repetí luego la misma operatoria para los demás servicios.'
        ]
      }
    case 'delegate':
      return {
        title: 'Cargar el autorizado',
        description: 'Para tercerización, el PDF indica ingresar el CUIT del tercero en la selección del representante.',
        icon: <IconChecklist className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/pdf/page-09.png',
        items: [
          'En “CUIT/CUIL/CDI Usuario”, ingresá el CUIT autorizado.',
          'Usá exactamente el CUIT mostrado por este asistente.',
          'Después buscá y dejá cargado el autorizado.'
        ]
      }
    case 'confirm':
      return {
        title: 'Confirmar la delegación',
        description: 'El instructivo oficial muestra la revisión final y la constancia emitida por ARCA al confirmar.',
        icon: <IconCheck className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/pdf/page-10.png',
        items: [
          'Revisá autorizante, autorizado y servicio.',
          'Confirmá la operación en ARCA.',
          'Repetí el proceso para cada servicio pendiente.'
        ]
      }
    default:
      return {
        title: 'Aceptar pendientes y verificar',
        description: 'El PDF aclara que puede quedar una autorización pendiente de aceptación. Después de completar eso, validamos el acceso real.',
        icon: <IconShieldCheck className="h-5 w-5" />,
        imageUrl: '/illustrations/arca-wizard/pdf/page-11.png',
        items: [
          'Si ARCA muestra pendientes, aceptalos desde el autorizado.',
          'Cuando termines, volvé a esta pantalla.',
          'La verificación consulta WSFE y padrón para habilitar el panel.'
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
  onAuthorizedCuitDefined,
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
  onAuthorizedCuitDefined: () => void
  onDelegated: () => void
  onVerify: () => void
}) {
  const next = getAssistantNextStep(wizard, activeStep)
  const primary = getPrimaryAction(wizard, activeStep, action, onStart, onOpenArca, onAdminFound, onWebservicesFound, onAuthorizedCuitDefined, onDelegated, onVerify)

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
      description: 'El instructivo oficial contempla pendientes de aceptación. Si eso no está resuelto, la validación real va a fallar.',
      items: [
        'Confirmá que el CUIT autorizado sea exactamente el indicado en esta pantalla.',
        'Revisá que delegaste todos los servicios requeridos.',
        'Si hay una relación pendiente de aceptación, completala desde el autorizado.',
        'Si acabás de delegar, esperá unos minutos y ejecutá la verificación nuevamente.'
      ]
    }
  }

  switch (activeStep?.key) {
    case 'login':
      return {
        title: 'Primero ingresá a ARCA',
        description: 'Seguimos el instructivo oficial desde el inicio: el contribuyente que delega debe entrar con su clave fiscal.',
        items: [
          'Usá el CUIT que figura como emisor.',
          'Completá CUIT, clave fiscal y cualquier validación de ARCA.',
          'Cuando veas el panel principal, volvé al asistente.'
        ]
      }
    case 'admin':
      return {
        title: 'Buscar el administrador de relaciones',
        description: 'El segundo paso del PDF es abrir el servicio Administrador de Relaciones.',
        items: [
          'Usá el buscador o el listado de servicios.',
          'Buscá “administrador de relaciones”.',
          'Cuando lo abras, volvé y seguí.'
        ]
      }
    case 'webservices':
      return {
        title: 'Buscá los webservices',
        description: 'Dentro de “Nueva Relación”, ARCA pide seleccionar el servicio a autorizar.',
        items: [
          'Elegí “Nueva Relación”.',
          'Entrá a la agrupación WebServices.',
          'Seleccioná uno de los servicios requeridos.',
          'Más adelante repetís la misma operatoria para los demás.'
        ]
      }
    case 'delegate':
      return {
        title: 'Cargá el CUIT autorizado',
        description: 'Para tercerización, el instructivo oficial pide ingresar el CUIT del tercero en la selección del representante.',
        items: [
          'Buscá el autorizado en el campo “CUIT/CUIL/CDI Usuario”.',
          'Usá exactamente el CUIT que muestra este asistente.',
          'Cuando quede cargado, seguí con la confirmación en ARCA.'
        ]
      }
    case 'confirm':
      return {
        title: 'Confirmá la delegación',
        description: 'ARCA muestra una revisión final. Confirmá esa relación antes de volver al sistema.',
        items: [
          'Revisá el autorizante, el autorizado y el servicio.',
          'Presioná “Confirmar” en ARCA.',
          'Repetí la misma operatoria para cada servicio requerido.',
          'Después volvé acá para validar.'
        ]
      }
    default:
      return {
        title: 'Aceptá pendientes y verificá el acceso',
        description: 'Según el PDF, puede quedar una aceptación pendiente del lado autorizado. Cuando eso esté completo, probamos el acceso real.',
        items: [
          'Si ARCA muestra relaciones pendientes, aceptalas antes de seguir.',
          'La validación consulta WSFE para puntos de venta.',
          'También consulta padrón para datos fiscales.',
          'Si ambas responden, el panel queda habilitado.'
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
  onAuthorizedCuitDefined: () => void,
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
    return { label: 'Ya cargué el CUIT autorizado', onClick: onAuthorizedCuitDefined, icon: <IconArrowRight className="h-4 w-4" /> }
  }
  if (activeStep?.key === 'confirm') {
    return { label: 'Ya confirmé en ARCA', onClick: onDelegated, icon: <IconCheck className="h-4 w-4" /> }
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
        className="max-h-[42rem] w-full object-contain"
        onError={() => setImageUnavailable(true)}
      />
    </div>
  )
}
