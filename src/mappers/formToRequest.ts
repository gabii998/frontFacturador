import type { RegisterForm } from '../models/RegisterForms'
import type {
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload
} from '../services/auth'
import type { ChangePasswordPayload } from '../services/profile'
import type { DataDeletionPayload } from '../services/privacy'

type ChangePasswordFormValues = {
  currentPassword: string
  newPassword: string
}

type DataDeletionFormValues = {
  email: string
}

const trimText = (value: string | null | undefined) => (value ?? '').trim()

const optionalTrimText = (value: string | null | undefined) => {
  const sanitized = trimText(value)
  return sanitized.length > 0 ? sanitized : undefined
}

export const mapLoginFormToRequest = (values: LoginPayload): LoginPayload => ({
  email: trimText(values.email),
  password: values.password
})

export const mapForgotPasswordFormToRequest = (
  values: ForgotPasswordPayload
): ForgotPasswordPayload => ({
  email: trimText(values.email)
})

export const mapRegisterFormToRequest = (values: RegisterForm): RegisterPayload => ({
  name: optionalTrimText(values.name),
  email: trimText(values.email),
  phone: trimText(values.phone),
  cuit: optionalTrimText(values.cuit),
  password: values.password
})

export const mapChangePasswordFormToRequest = (
  email: string,
  values: ChangePasswordFormValues
): ChangePasswordPayload => ({
  email: trimText(email),
  currentPassword: values.currentPassword,
  newPassword: values.newPassword
})

export const mapDataDeletionFormToRequest = (
  values: DataDeletionFormValues
): DataDeletionPayload => ({
  email: trimText(values.email)
})
