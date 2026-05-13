import { get, patch, post } from './api'
import { type PlanCode } from '../constants/planes'

export interface AdminPlan {
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

export interface UpdateAdminPlanPayload {
  title?: string
  description?: string
  price?: number
  displayOrder?: number
  enabled?: boolean
  invoiceLimit?: number | null
  durationMonths?: number | null
  indefiniteDuration?: boolean
  whatsappEmissionEnabled?: boolean
  bulkEmissionEnabled?: boolean
  bulkEmissionLimit?: number | null
  addon?: boolean
  requiresActiveSubscription?: boolean
}

export interface CreateAdminPlanPayload {
  code: string
  title: string
  description?: string
  price: number
  enabled?: boolean
  invoiceLimit?: number | null
  durationMonths?: number | null
  indefiniteDuration?: boolean
  whatsappEmissionEnabled?: boolean
  bulkEmissionEnabled?: boolean
  bulkEmissionLimit?: number | null
  addon?: boolean
  requiresActiveSubscription?: boolean
}

export const AdminPlansService = {
  list: () => get<AdminPlan[]>('/api/admin/plans'),
  create: (payload: CreateAdminPlanPayload) =>
    post<AdminPlan>('/api/admin/plans', payload),
  update: (code: PlanCode, payload: UpdateAdminPlanPayload) =>
    patch<AdminPlan>(`/api/admin/plans/${encodeURIComponent(code)}`, payload)
}
