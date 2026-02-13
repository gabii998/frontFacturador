import { FormFieldConfig } from "../../components/FormFieldsArray"

export type LoginFormValues = {
  email: string
  password: string
}

export const LOGIN_FIELDS: FormFieldConfig<LoginFormValues>[] = [
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autocomplete: 'email',
    required: true,
    labelClassName: 'auth-item'
  },
  {
    name: 'password',
    label: 'Contrasena',
    type: 'password',
    autocomplete: 'current-password',
    required: true,
  }
]