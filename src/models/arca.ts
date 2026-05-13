export type ArcaPermissionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'ADMIN_RELATIONS_FOUND'
  | 'WEBSERVICES_FOUND'
  | 'WAITING_VERIFICATION'
  | 'VERIFIED'
  | 'VERIFICATION_FAILED'

export interface ArcaPermissionWizardStep {
  key: string
  title: string
  description: string
  actionLabel?: string | null
  actionUrl?: string | null
  completed: boolean
}

export interface ArcaPermissionWizardResponse {
  status: ArcaPermissionStatus
  userCuit?: string | null
  delegateCuit?: string | null
  delegateName?: string | null
  requiredServices: string[]
  arcaLoginUrl: string
  adminRelationsUrl: string
  steps: ArcaPermissionWizardStep[]
  startedAt?: string | null
  delegatedAt?: string | null
  verifiedAt?: string | null
  lastVerificationAt?: string | null
  lastVerificationError?: string | null
  canEmit: boolean
}
