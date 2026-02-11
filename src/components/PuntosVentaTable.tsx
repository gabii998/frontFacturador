import { IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonText } from '@ionic/react'
import type { PuntoVenta } from '../models/afip'

export default function PuntosVentaTable({ data }: { data: PuntoVenta[] }) {
  return (
    <IonCard className="card w-full surface-card-soft">
      <IonCardContent>
        <IonGrid>
          <IonRow className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            <IonCol size="3">Nro</IonCol>
            <IonCol size="3">Emision</IonCol>
            <IonCol size="3">Bloqueado</IonCol>
            <IonCol size="3">Baja</IonCol>
          </IonRow>
          {data.map((pv) => (
            <IonRow key={pv.nro} className="border-b border-slate-100 py-2 text-sm text-slate-700 last:border-b-0">
              <IonCol size="3" className="font-medium">{pv.nro}</IonCol>
              <IonCol size="3">{pv.emisionTipo}</IonCol>
              <IonCol size="3">{pv.bloqueado ? 'Si' : 'No'}</IonCol>
              <IonCol size="3"><IonText>{pv.fchBaja ?? '-'}</IonText></IonCol>
            </IonRow>
          ))}
        </IonGrid>
      </IonCardContent>
    </IonCard>
  )
}
