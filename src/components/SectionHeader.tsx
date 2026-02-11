import { IonCard, IonCardContent } from '@ionic/react'
import SectionHeaderProps from '../props/SectionHeaderProps'

const SectionHeader = (props: SectionHeaderProps) => {
  return (
    <IonCard className="card surface-card">
      <IonCardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          {props.icon && (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-600">
              <div className="flex h-5 w-5 items-center justify-center">{props.icon}</div>
            </div>
          )}
          <div className="flex-1 space-y-1">
            <h1 className="text-lg font-semibold text-slate-900">{props.title}</h1>
            {props.subtitle && <p className="body-copy-muted">{props.subtitle}</p>}
          </div>
        </div>
        {props.rightContent && (
          <div className="body-copy flex flex-wrap gap-2 md:justify-end">
            {props.rightContent}
          </div>
        )}
      </IonCardContent>
      {props.bottomContent && (
        <div className="mt-3">
          {typeof props.bottomContent === 'function' ? props.bottomContent(false) : props.bottomContent}
        </div>
      )}
    </IonCard>
  )
}

export default SectionHeader
