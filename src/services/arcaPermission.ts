import { get, post } from './api'
import type { ArcaPermissionWizardResponse } from '../models/arca'

const BASE_PATH = '/api/afip/permission-wizard'

export const ArcaPermissionService = {
  get: () => get<ArcaPermissionWizardResponse>(BASE_PATH),
  start: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/start`),
  markAdminRelationsFound: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/admin-relations-found`),
  markWebservicesFound: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/webservices-found`),
  markAuthorizedCuitDefined: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/authorized-cuit-defined`),
  markDelegated: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/delegated`),
  verify: () => post<ArcaPermissionWizardResponse>(`${BASE_PATH}/verify`)
}
