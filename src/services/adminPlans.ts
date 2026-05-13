import { get, patch } from './api'
import { type PlanCode } from '../constants/planes'

export interface AdminPlan {
  code: PlanCode
  title: string
  description: string
  price: number
  enabled: boolean
  updatedAt?: string | null
}

export const AdminPlansService = {
  list: () => get<AdminPlan[]>('/api/admin/plans'),
  update: (code: PlanCode, enabled: boolean) =>
    patch<AdminPlan>(`/api/admin/plans/${encodeURIComponent(code)}`, { enabled })
}
