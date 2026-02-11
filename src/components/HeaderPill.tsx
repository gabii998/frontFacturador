import { IonChip, IonLabel } from '@ionic/react'
import HeaderPillProps from '../props/HeaderPillProps'

const HeaderPill = (props: HeaderPillProps) => {
  return (
    <IonChip className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm" outline={false}>
      <span className={`h-2 w-2 rounded-full ${props.dotColor}`} aria-hidden />
      <IonLabel>{props.label}</IonLabel>
    </IonChip>
  )
}

export default HeaderPill
