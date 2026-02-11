import { IonChip, IonLabel } from '@ionic/react'
import { DashboardService } from '../props/DashboardProps'

const DashboardHeaderPill = ({ service }: { service: DashboardService }) => {
  return (
    <IonChip className={`service-chip service-chip--${service.tone}`} outline={false}>
      <span className="service-chip__dot" />
      <IonLabel>
        <span className="service-chip__label">{service.label}</span>
        <span className="service-chip__status">{service.status}</span>
      </IonLabel>
    </IonChip>
  )
}

export default DashboardHeaderPill
