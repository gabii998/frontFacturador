import { FormFieldConfig } from "../../components/FormFieldsArray"
import { RegisterForm } from "../../models/RegisterForms"

export const REGISTER_FIELDS: FormFieldConfig<RegisterForm>[] = [
  {
    name: 'name',
    label: 'Nombre completo',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  },
  {
    name: 'phone',
    label: 'Celular',
    type: 'tel',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  },
  {
    name: 'cuit',
    label: 'CUIT',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  },
  {
    name: 'condicionImpositiva',
    label: 'Condicion Impositiva',
    kind: 'select',
    required: true,
    variant: 'auth',
    labelClassName: 'auth-field__label',
    options: [
      { value: '', label: 'Seleccione...' },
      { value: 'Monotributista', label: 'Monotributista' },
      { value: 'Responsable Inscripto', label: 'Responsable Inscripto' }
    ]
  },
  {
    name: 'password',
    label: 'Contrasena',
    type: 'password',
    required: true,
    minLength: 8,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  },
  {
    name: 'confirmPassword',
    label: 'Repetir contrasena',
    type: 'password',
    required: true,
    minLength: 8,
    variant: 'auth',
    labelClassName: 'auth-field__label'
  }
]

export const initialRegisterForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  cuit: '',
  condicionImpositiva: '',
  password: '',
  confirmPassword: ''
}