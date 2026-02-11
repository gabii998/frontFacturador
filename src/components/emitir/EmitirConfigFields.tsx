import { IonInput, IonSelect, IonSelectOption, IonText } from '@ionic/react'
import type { Concepto, PuntoVenta } from '../../models/afip'
import FormItemField from '../FormItemField'

const today = new Date().toISOString().slice(0, 10)

export const PuntoVentaField = ({
  puntosVenta,
  pv,
  setPv
}: {
  puntosVenta: PuntoVenta[]
  pv: number
  setPv: (value: number) => void
}) => (
  <FormItemField label="Punto de venta">
    {puntosVenta.length > 0 ? (
      <IonSelect value={pv} onIonChange={e => setPv(Number(e.detail.value))}>
        {puntosVenta.map(item => (
          <IonSelectOption key={item.nro} value={item.nro}>
            PV {item.nro} - {item.emisionTipo}
          </IonSelectOption>
        ))}
      </IonSelect>
    ) : (
      <IonInput
        type="number"
        value={String(pv)}
        onIonInput={e => setPv(Number(e.detail.value ?? 0))}
        placeholder="Ingresa el punto de venta"
      />
    )}
  </FormItemField>
)

export const ConceptoField = ({
  concepto,
  setConcepto
}: {
  concepto: Concepto
  setConcepto: (value: Concepto) => void
}) => (
  <FormItemField label="Concepto">
    <IonSelect value={concepto} onIonChange={e => setConcepto(e.detail.value as Concepto)}>
      <IonSelectOption value="PRODUCTOS">Productos</IonSelectOption>
      <IonSelectOption value="SERVICIOS">Servicios</IonSelectOption>
      <IonSelectOption value="AMBOS">Productos y servicios</IonSelectOption>
    </IonSelect>
  </FormItemField>
)

export const FechaComprobanteField = ({
  fechaEmision,
  setFechaEmision
}: {
  fechaEmision: string
  setFechaEmision: (value: string) => void
}) => (
  <FormItemField label="Fecha del comprobante">
    <IonInput type="date" value={fechaEmision} onIonInput={e => setFechaEmision(e.detail.value ?? today)} />
  </FormItemField>
)

export const PuntosVentaError = ({ message }: { message: string | null }) => (
  message ? <IonText color="warning" className="text-xs">{message}</IonText> : null
)

export const ServicePeriodFields = ({
  servicioDesde,
  setServicioDesde,
  servicioHasta,
  setServicioHasta,
  vencimientoPago,
  setVencimientoPago
}: {
  servicioDesde: string
  setServicioDesde: (value: string) => void
  servicioHasta: string
  setServicioHasta: (value: string) => void
  vencimientoPago: string
  setVencimientoPago: (value: string) => void
}) => (
  <section className="space-y-4">
    <div>
      <h3 className="mt-1 text-base font-semibold text-slate-800">Periodo del servicio</h3>
      <p className="caption-copy">Informa las fechas de prestacion y vencimiento para comprobantes de servicios o mixtos.</p>
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <FormItemField label="Desde">
        <IonInput type="date" value={servicioDesde} onIonInput={e => setServicioDesde(e.detail.value ?? today)} />
      </FormItemField>
      <FormItemField label="Hasta">
        <IonInput type="date" value={servicioHasta} onIonInput={e => setServicioHasta(e.detail.value ?? today)} />
      </FormItemField>
      <FormItemField label="Vencimiento de pago">
        <IonInput type="date" value={vencimientoPago} onIonInput={e => setVencimientoPago(e.detail.value ?? today)} />
      </FormItemField>
    </div>
  </section>
)
