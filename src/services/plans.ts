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

export const PlansService = {
  getCurrent: (userId: string) =>
    get<PlanStatusResponse>(`/api/plans/current?userId=${encodeURIComponent(userId)}`)
}

export type PlansServiceType = typeof PlansService
