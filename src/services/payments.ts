import { post } from './api'
import { PlanCode } from '../constants/planes'

export interface CreatePlanPreferencePayload {
  plan: PlanCode
  userId: string
}

export interface CreatePlanPreferenceResponse {
  preferenceId: string
  initPoint?: string | null
  sandboxInitPoint?: string | null
  plan: PlanCode
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  expiresAt?: string | null
  previousPlan?: PlanCode | null
}

export const PaymentsService = {
  createPlanPreference: (payload: CreatePlanPreferencePayload) =>
    post<CreatePlanPreferenceResponse>('/api/payments/mercadopago/preference', payload)
}

export type PaymentsServiceType = typeof PaymentsService
