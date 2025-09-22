import { get, post } from './api'

export interface AfipCredentialPayload {
  certificate: string
  privateKey: string
  alias: string
}

export interface AfipCredentialStatus {
  configured: boolean
  alias?: string | null
  updatedAt?: string | null
}

export const OnboardingService = {
  save: (payload: AfipCredentialPayload) => post<void>('/api/onboarding/afip-credentials', payload),
  status: () => get<AfipCredentialStatus>('/api/onboarding/afip-credentials/status')
}
