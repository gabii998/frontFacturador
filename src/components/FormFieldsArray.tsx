import type { ComponentProps } from 'react'
import { IonInput } from '@ionic/react'
import FormItemField from './FormItemField'

type SelectOption = {
  value: string
  label: string
}

type StringFieldName<T> = Extract<{
  [K in keyof T]-?: T[K] extends string ? K : never
}[keyof T], string>

type BaseFieldConfig<T extends object> = {
  name: StringFieldName<T>
  label: string
  required?: boolean
  className?: string
  labelClassName?: string
  variant?: 'default' | 'sm' | 'auth'
}

type InputFieldConfig<T extends object> = BaseFieldConfig<T> & {
  kind?: 'input'
  type?: ComponentProps<typeof IonInput>['type']
  autocomplete?: ComponentProps<typeof IonInput>['autocomplete']
  minLength?: number
  placeholder?: string
  disabled?: boolean
}

type SelectFieldConfig<T extends object> = BaseFieldConfig<T> & {
  kind: 'select'
  options: SelectOption[]
}

export type FormFieldConfig<T extends object> =
  | InputFieldConfig<T>
  | SelectFieldConfig<T>

type FormFieldsArrayProps<T extends object> = {
  fields: FormFieldConfig<T>[]
  values: T
  setField: <K extends StringFieldName<T>>(field: K, value: T[K]) => void
}

const isSelectField = <T extends object>(field: FormFieldConfig<T>) =>
  field.kind === 'select'

const fieldValueAsString = <T extends object>(
  values: T,
  name: StringFieldName<T>
) => {
  const value = values[name]
  return typeof value === 'string' ? value : ''
}

const FormFieldsArray = <T extends object>({
  fields,
  values,
  setField
}: FormFieldsArrayProps<T>) => (
  <>
    {fields.map((field) => (
      <FormItemField
        key={field.name}
        label={field.label}
        variant={field.variant}
        className={field.className}
        labelClassName={field.labelClassName}
      >
        {isSelectField(field) ? (
          <select
            name={field.name}
            className="input"
            value={fieldValueAsString(values, field.name)}
            onChange={(event) => setField(field.name, event.target.value as T[typeof field.name])}
            required={field.required}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        ) : (
          <IonInput
            type={field.type}
            autocomplete={field.autocomplete}
            placeholder={field.placeholder}
            value={fieldValueAsString(values, field.name)}
            minlength={field.minLength}
            disabled={field.disabled}
            onIonInput={(event) => setField(field.name, (event.detail.value ?? '') as T[typeof field.name])}
            required={field.required}
          />
        )}
      </FormItemField>
    ))}
  </>
)

export default FormFieldsArray
