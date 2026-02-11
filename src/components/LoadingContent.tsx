import { IonCard, IonCardContent, IonSkeletonText, IonSpinner } from '@ionic/react'

const LoadingContent = () => {
  return (
    <IonCard className="card animate-pulse text-slate-500">
      <IonCardContent className="flex flex-col items-center gap-5 py-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-inner">
          <IonSpinner name="crescent" color="primary" />
        </div>

        <div className="w-2/3 space-y-2 text-center">
          <IonSkeletonText animated style={{ width: '50%', margin: '0 auto', height: '16px' }} />
          <IonSkeletonText animated style={{ width: '80%', margin: '0 auto', height: '12px' }} />
          <IonSkeletonText animated style={{ width: '60%', margin: '0 auto', height: '12px' }} />
        </div>
      </IonCardContent>
    </IonCard>
  )
}

export default LoadingContent
