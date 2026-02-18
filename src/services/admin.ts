import { get, post } from './api'
import { type PlanCode } from '../constants/planes'
import { type AuthUser } from './auth'

export interface AdminUserSummary extends AuthUser {
  currentPlan: PlanCode
  planExpiresAt: string | null
  createdAt: string
}

export interface AdminUsersPageResponse {
  page: number
  size: number
  totalElements: number
  totalPages: number
  items: AdminUserSummary[]
}

export interface UpdateUserRolePayload {
  role: 'USER' | 'SUPERUSER'
}

export interface UpdateUserPlanPayload {
  plan: PlanCode
  durationMonths?: number
  expiresAt?: string
}

export interface PlanStatusResponse {
  plan: PlanCode
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  expiresAt: string | null
  previousPlan?: PlanCode | null
  preferenceId?: string | null
  paymentStatus?: string | null
}

export const AdminService = {
  listUsers: (page = 0, size = 25) =>
    get<AdminUsersPageResponse>(`/api/auth/users?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`),
  updateUserRole: (userId: string, payload: UpdateUserRolePayload) =>
    post<AuthUser>(`/api/auth/users/${encodeURIComponent(userId)}/role`, payload),
  updateUserPlan: (userId: string, payload: UpdateUserPlanPayload) =>
    post<PlanStatusResponse>(`/api/auth/users/${encodeURIComponent(userId)}/plan`, payload)
}
