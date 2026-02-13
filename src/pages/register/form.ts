import { FormFieldConfig } from "../../components/FormFieldsArray"
import { RegisterForm } from "../../models/RegisterForms"

export const REGISTER_FIELDS: FormFieldConfig<RegisterForm>[] = [
  {
    name: 'name',
    label: 'Nombre completo',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  },
  {
    name: 'phone',
    label: 'Celular',
    type: 'tel',
    required: true,
  },
  {
    name: 'cuit',
    label: 'CUIT',
    required: true,
  },
  {
    name: 'condicionImpositiva',
    label: 'Condicion Impositiva',
    kind: 'select',
    required: true,
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
  },
  {
    name: 'confirmPassword',
    label: 'Repetir contrasena',
    type: 'password',
    required: true,
    minLength: 8,
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