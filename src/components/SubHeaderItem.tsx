import { IonCard, IonCardContent } from '@ionic/react'
import SubHeaderItemProps from '../props/SubHeaderItemProps'

const SubHeaderItem = (props: SubHeaderItemProps) => {
  return (
    <IonCard className="card flex-1 min-w-[calc(50%-0.5rem)] border border-slate-200 bg-white/95 px-2.5 py-1.5 text-center shadow-sm sm:min-w-[160px] sm:text-left">
      <IonCardContent className="flex flex-col gap-1 p-0">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-slate-400">{props.title}</span>
        <p className="text-[0.95rem] font-semibold leading-tight text-slate-800">{props.content}</p>
      </IonCardContent>
    </IonCard>
  )
}

export default SubHeaderItem
