export const PLAN_NAMES = ['Gratuito', 'Estándar', 'Avanzado'] as const

export type PlanName = (typeof PLAN_NAMES)[number]

export type PlanCode = 'free' | 'standard' | 'advanced'

export const PLAN_CODE_TO_NAME: Record<PlanCode, PlanName> = {
  free: 'Gratuito',
  standard: 'Estándar',
  advanced: 'Avanzado'
}

export const PLAN_NAME_TO_CODE: Record<PlanName, PlanCode> = {
  Gratuito: 'free',
  'Estándar': 'standard',
  Avanzado: 'advanced'
}

export interface PlanDetail {
  code: PlanCode
  name: PlanName
  headline: string
  price: string
  description: string
  features: string[]
  highlighted?: boolean
}

export const PLAN_COLORS: Record<PlanName, string> = {
  Gratuito: 'bg-emerald-400',
  'Estándar': 'bg-indigo-500',
  Avanzado: 'bg-amber-500'
}

export const PLAN_COLORS_BY_CODE: Record<PlanCode, string> = {
  free: PLAN_COLORS['Gratuito'],
  standard: PLAN_COLORS['Estándar'],
  advanced: PLAN_COLORS['Avanzado']
}

export const PLAN_DETAILS: PlanDetail[] = [
  {
    code: 'free',
    name: 'Gratuito',
    headline: 'Ideal para empezar',
    price: '$0 / mes',
    description: 'Configurá tu negocio y emití tus primeros comprobantes sin costo.',
    features: [
      'Hasta 10 comprobantes mensuales',
      'Un punto de venta habilitado',
      'Soporte por correo en 48 h'
    ]
  },
  {
    code: 'standard',
    name: 'Estándar',
    headline: 'Para equipos en crecimiento',
    price: '$4.999 / mes',
    description: 'Sumá más usuarios y automatizá tus procesos cotidianos.',
    highlighted: true,
    features: [
      'Comprobantes ilimitados',
      'Hasta 5 puntos de venta',
      'Automatización de vencimientos',
      'Soporte prioritario (24 h)'
    ]
  },
  {
    code: 'advanced',
    name: 'Avanzado',
    headline: 'Operaciones de alto volumen',
    price: '$9.999 / mes',
    description: 'Integraciones y flujos avanzados para equipos exigentes.',
    features: [
      'Comprobantes ilimitados',
      'Puntos de venta ilimitados',
      'Integración API premium',
      'Soporte dedicado 24/7'
    ]
  }
]
