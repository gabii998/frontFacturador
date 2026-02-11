import { IonCard, IonCardContent } from '@ionic/react'
import EmptyContentProps from '../props/EmptyContentProps'

const EmptyContent = (props: EmptyContentProps) => {
  return (
    <IonCard className="card text-slate-500">
      <IonCardContent className="flex flex-col items-center gap-5 py-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-100 shadow-inner text-blue-500">
          {props.icon}
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-slate-700">{props.title}</h2>
          <p className="text-sm leading-relaxed">{props.subtitle}</p>
        </div>
      </IonCardContent>
    </IonCard>
  )
}

export default EmptyContent
