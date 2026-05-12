import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from './Brand'

type PublicContentLayoutProps = {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  action?: ReactNode
}

export default function PublicContentLayout({ eyebrow, title, subtitle, children, action }: PublicContentLayoutProps) {
  return (
    <div className="public-page">
      <header className="public-page__topbar">
        <Link to="/" aria-label="Volver al inicio">
          <Brand />
        </Link>
        <Link to="/" className="landing-toolbar__login">
          Inicio
        </Link>
      </header>
      <main className="public-page__main">
        <section className="public-page__hero">
          <div>
            <p className="public-page__eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {action && (
            <div className="public-page__action">
              {action}
            </div>
          )}
        </section>
        {children}
      </main>
    </div>
  )
}
