import { IonInput, IonSelect, IonSelectOption } from '@ionic/react'
import type { CondicionImpositiva, DocumentoTipo } from '../../models/afip'
import FormItemField from '../FormItemField'

export const CondicionReceptorField = ({
  cond,
  setCond
}: {
  cond: CondicionImpositiva
  setCond: (value: CondicionImpositiva) => void
}) => (
  <FormItemField label="Condicion IVA receptor">
    <IonSelect value={cond} onIonChange={e => setCond(e.detail.value as CondicionImpositiva)}>
      <IonSelectOption value="CONSUMIDOR_FINAL">Consumidor Final</IonSelectOption>
      <IonSelectOption value="MONOTRIBUTO">Monotributo</IonSelectOption>
      <IonSelectOption value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</IonSelectOption>
      <IonSelectOption value="EXENTO">Exento</IonSelectOption>
      <IonSelectOption value="NO_ALCANZADO">No alcanzado</IonSelectOption>
      <IonSelectOption value="SUJETO_NO_CATEGORIZADO">Sujeto no categorizado</IonSelectOption>
    </IonSelect>
  </FormItemField>
)

export const DocumentoFields = ({
  docTipo,
  setDocTipo,
  docNro,
  setDocNro
}: {
  docTipo: DocumentoTipo
  setDocTipo: (value: DocumentoTipo) => void
  docNro: string
  setDocNro: (value: string) => void
}) => (
  <div className="space-y-2">
    <label className="label">Documento</label>
    <div className="flex flex-col gap-2 md:flex-row">
      <FormItemField label="Tipo" className="md:w-44">
        <IonSelect value={docTipo} onIonChange={e => setDocTipo(e.detail.value as DocumentoTipo)}>
          <IonSelectOption value="DNI">DNI</IonSelectOption>
          <IonSelectOption value="CUIT">CUIT</IonSelectOption>
          <IonSelectOption value="SIN_IDENTIFICAR">SIN_IDENTIFICAR</IonSelectOption>
        </IonSelect>
      </FormItemField>
      <FormItemField label="Numero" className="flex-1">
        <IonInput value={docNro} onIonInput={e => setDocNro(e.detail.value ?? '')} />
      </FormItemField>
    </div>
  </div>
)
