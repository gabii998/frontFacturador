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
  totalCount: number
  userCount: number
  superuserCount: number
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

export interface EnqueueNotificationPayload {
  userId: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  title: string
  body: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

export const AdminService = {
  listUsers: (page = 0, size = 25, role?: 'USER' | 'SUPERUSER') => {
    const query = new URLSearchParams({
      page: String(page),
      size: String(size)
    })
    if (role) query.set('role', role)
    return get<AdminUsersPageResponse>(`/api/auth/users?${query.toString()}`)
  },
  updateUserRole: (userId: string, payload: UpdateUserRolePayload) =>
    post<AuthUser>(`/api/auth/users/${encodeURIComponent(userId)}/role`, payload),
  updateUserPlan: (userId: string, payload: UpdateUserPlanPayload) =>
    post<PlanStatusResponse>(`/api/auth/users/${encodeURIComponent(userId)}/plan`, payload),
  enqueueNotification: (payload: EnqueueNotificationPayload) =>
    post<{ queueId: string }>('/api/admin/notifications/enqueue', payload)
}
