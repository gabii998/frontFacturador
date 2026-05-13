import { get } from './api'
import { PlanCode } from '../constants/planes'

export type PlanStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING'

export interface PlanStatusResponse {
  plan: PlanCode
  status: PlanStatus
  expiresAt: string | null
  previousPlan?: PlanCode | null
  preferenceId?: string | null
  paymentStatus?: string | null
}

export interface PlanCatalogItem {
  code: PlanCode
  title: string
  description: string
  price: number
  enabled: boolean
  invoiceLimit?: number | null
  durationMonths?: number | null
  indefiniteDuration: boolean
  whatsappEmissionEnabled: boolean
  bulkEmissionEnabled: boolean
  bulkEmissionLimit?: number | null
  addon: boolean
  requiresActiveSubscription: boolean
  updatedAt?: string | null
}

export const PlansService = {
  getCurrent: (userId: string) =>
    get<PlanStatusResponse>(`/api/plans/current?userId=${encodeURIComponent(userId)}`),
  getCatalog: () => get<PlanCatalogItem[]>('/api/plans/catalog')
}

export type PlansServiceType = typeof PlansService
