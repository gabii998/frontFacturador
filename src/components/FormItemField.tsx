import { IonItem, IonLabel } from '@ionic/react'
import type { ReactNode } from 'react'

type FormItemFieldVariant = 'default' | 'sm' | 'auth'

type FormItemFieldProps = {
  label: ReactNode
  children: ReactNode
  className?: string
  labelClassName?: string
  variant?: FormItemFieldVariant
}

const ITEM_VARIANT_CLASS: Record<FormItemFieldVariant, string> = {
  default: 'form-item',
  sm: 'form-item-sm',
  auth: 'auth-input-item'
}

const joinClassNames = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ')

export default function FormItemField({
  label,
  children,
  className,
  labelClassName,
  variant = 'default'
}: FormItemFieldProps) {
  return (
    <div className={joinClassNames(ITEM_VARIANT_CLASS[variant], className)}>
      <label className={labelClassName}>{label}</label>
      {children}
    </div>
  )
}
