import type { ReactNode } from 'react'
import { IonCard, IonCardContent } from '@ionic/react'

type PageHeroCardProps = {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

const PageHeroCard = ({ eyebrow, title, description, action }: PageHeroCardProps) => (
  <IonCard className="surface-card">
    <IonCardContent>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="body-copy mt-3 max-w-2xl">{description}</p>
        </div>
        {action}
      </div>
    </IonCardContent>
  </IonCard>
)

export default PageHeroCard
