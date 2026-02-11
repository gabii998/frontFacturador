import type { FormEvent, ReactNode } from 'react'
import ErrorBox from './ErrorBox'

type AuthFormLayoutProps = {
  eyebrow: string
  title: string
  subtitle: string
  error?: unknown
  notice?: ReactNode
  footer: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  children: ReactNode
}

const AuthFormLayout = ({
  eyebrow,
  title,
  subtitle,
  error,
  notice,
  footer,
  onSubmit,
  children
}: AuthFormLayoutProps) => (
  <div className="auth-form">
    <div className="auth-form__header">
      <span className="auth-eyebrow">{eyebrow}</span>
      <h1 className="auth-form__title">{title}</h1>
      <p className="auth-form__subtitle">{subtitle}</p>
    </div>
    <ErrorBox error={error} />
    {notice}
    <form className="auth-form__body" onSubmit={onSubmit}>
      {children}
    </form>
    <div className="auth-form__footer">{footer}</div>
  </div>
)

export default AuthFormLayout
