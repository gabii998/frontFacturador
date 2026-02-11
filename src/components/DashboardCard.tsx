import { IonButton, IonCard, IonCardContent } from '@ionic/react'
import { useNavigate } from 'react-router-dom'
import { DashboardCardProps } from '../props/DashboardProps'

const DashboardCard = (props: DashboardCardProps) => {
  const navigate = useNavigate()

  return (
    <IonCard className="metric-card">
      <IonCardContent className="flex flex-col gap-4">
        <div className="metric-card__icon metric-card__icon--blue">{props.icon}</div>
        <header className="metric-card__header">
          <span className="metric-card__label">{props.section}</span>
          <strong className="metric-card__value">{props.title}</strong>
        </header>
        <p className="metric-card__description">{props.content}</p>
        <IonButton
          fill="clear"
          className="metric-card__cta self-start"
          onClick={() => navigate(`/${props.buttonDestination}`)}
        >
          {props.buttonLabel}
        </IonButton>
      </IonCardContent>
    </IonCard>
  )
}

export default DashboardCard
