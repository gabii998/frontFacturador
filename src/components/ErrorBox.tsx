import { IonCard, IonCardContent, IonIcon } from '@ionic/react'
import { alertCircleOutline } from 'ionicons/icons'
import { ApiError } from '../services/api'

export default function ErrorBox({ error }: { error?: unknown }) {
  if (!error) return null

  let message: string

  if (error instanceof ApiError) {
    const suffix = error.message?.trim() || 'Error desconocido'
    message = `${error.status} ${suffix}`
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = String(error)
  }

  return (
    <IonCard className="card w-full bg-red-100 text-red-500">
      <IonCardContent className="flex flex-col items-center gap-5 py-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-inner text-red-500">
          <IonIcon icon={alertCircleOutline} className="text-4xl" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-red-700">Ha ocurrido un error</h2>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </IonCardContent>
    </IonCard>
  )
}
