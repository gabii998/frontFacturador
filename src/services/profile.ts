import { post } from './api'

export interface ChangePasswordPayload {
  email: string
  currentPassword: string
  newPassword: string
}

export function changePassword(payload: ChangePasswordPayload) {
  return post('/api/auth/password/change', payload)
}
