import { IonButton, IonFooter, IonToolbar } from '@ionic/react'
import { useNavigate } from 'react-router-dom'

export default function SiteFooter() {
  const navigate = useNavigate()

  return (
    <IonFooter className="border-t border-slate-200 bg-white text-xs md:text-sm">
      <IonToolbar className="container-max py-2">
        <div className="flex flex-col items-center gap-3 text-center text-slate-600 md:flex-row md:items-center md:justify-between md:gap-6 md:text-left">
          <div className="hidden space-y-1 md:block">
            <p className="text-sm font-semibold text-slate-800 md:text-base">Facturador</p>
            <p className="text-[0.7rem] text-slate-500 md:text-xs">Operamos con transparencia y te damos control sobre tus datos.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-1 text-[0.75rem] md:gap-2 md:text-sm md:justify-start">
            <IonButton fill="clear" size="small" onClick={() => navigate('/ayuda')}>Centro de ayuda</IonButton>
            <IonButton fill="clear" size="small" onClick={() => navigate('/politica-privacidad')}>Politica de privacidad</IonButton>
            <IonButton fill="clear" size="small" onClick={() => navigate('/terminos-condiciones')}>Terminos y condiciones</IonButton>
            <IonButton fill="clear" size="small" onClick={() => navigate('/eliminar-datos')}>Solicitar eliminacion de datos</IonButton>
          </nav>
        </div>
      </IonToolbar>
    </IonFooter>
  )
}
