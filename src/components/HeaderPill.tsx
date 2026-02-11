import { IonChip, IonLabel } from '@ionic/react'
import HeaderPillProps from '../props/HeaderPillProps'

const HeaderPill = (props: HeaderPillProps) => {
  return (
    <IonChip className="header-pill" outline={false}>
      <span className={`h-2 w-2 rounded-full ${props.dotColor}`} aria-hidden />
      <IonLabel>{props.label}</IonLabel>
    </IonChip>
  )
}

export default HeaderPill
