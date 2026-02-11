import { lazy, Suspense, useState } from 'react'
import { IonButton, IonCard, IonCardContent, IonSpinner } from '@ionic/react'
import { useNavigate } from 'react-router-dom'

const ComprobantesExcelUpload = lazy(() => import('../components/ComprobantesExcelUpload'))

export default function ComprobantesCargaMasivaPage() {
  const navigate = useNavigate()
  const [showUploader, setShowUploader] = useState(false)

  return (
    <div className="space-y-6">
      <IonCard className="card border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50">
        <IonCardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-lg shadow-emerald-500/20">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="13" width="30" height="24" rx="4" fill="#fff" />
                  <path d="M16 21h16" />
                  <path d="M16 27h16" />
                  <path d="M16 33h10" />
                  <path d="M13 9h22v4H13z" fill="#fff" />
                  <path d="M19 9v4" />
                  <path d="M29 9v4" />
                </svg>
              </div>
              <div className="space-y-2">
                <span className="auth-eyebrow">Comprobantes</span>
                <h1 className="text-2xl font-semibold text-slate-900">Carga masiva por Excel</h1>
                <p className="body-copy">
                  Importa un archivo con los puntos de venta, tipos y numeros de comprobantes para validar su estado directamente contra AFIP.
                </p>
              </div>
            </div>
            <IonButton fill="outline" onClick={() => navigate('/comprobantes')}>
              Volver al listado
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      {!showUploader ? (
        <IonCard className="surface-card">
          <IonCardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Carga diferida activada</h2>
              <p className="body-copy">
                Para optimizar tiempo de carga, el modulo Excel se inicializa solo cuando lo necesites.
              </p>
            </div>
            <IonButton onClick={() => setShowUploader(true)}>Abrir carga masiva</IonButton>
          </IonCardContent>
        </IonCard>
      ) : (
        <Suspense
          fallback={
            <IonCard className="surface-card">
              <IonCardContent className="flex items-center gap-2 text-slate-600">
                <IonSpinner name="crescent" />
                Cargando modulo Excel...
              </IonCardContent>
            </IonCard>
          }
        >
          <ComprobantesExcelUpload />
        </Suspense>
      )}
    </div>
  )
}
