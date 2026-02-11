import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/react'
import { addOutline } from 'ionicons/icons'
import type {
  FacturaSolicitud,
  CondicionImpositiva,
  DocumentoTipo,
  PuntoVenta,
  FacturaItem,
  Concepto,
  FacturaRespuesta
} from '../models/afip'
import { AfipService } from '../services/afip'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'
import ErrorBox from './ErrorBox'
import ActionButtonsGroup from './ActionButtonsGroup'
import { FooterProps, PrimerPasoProps, SegundoPasoProps, StepEmitir, TercerPasoProps } from '../props/EmitirProps'
import { Step } from '../props/Step'
import Steper from './Steper'
import { SuccessLite } from './Sucess'
import { useAsyncRequest } from '../hooks/useAsyncRequest'
import { useAsyncResource } from '../hooks/useAsyncResource'
import {
  ConceptoField,
  FechaComprobanteField,
  PuntoVentaField,
  PuntosVentaError,
  ServicePeriodFields
} from './emitir/EmitirConfigFields'
import { CondicionReceptorField, DocumentoFields } from './emitir/EmitirReceiverFields'
import { ItemCard, TotalSummary } from './emitir/EmitirItems'

const today = new Date().toISOString().slice(0, 10)

const DEFAULT_PUNTO_VENTA = 2
const DEFAULT_DOC_TIPO: DocumentoTipo = 'DNI'
const DEFAULT_DOC_NRO = '28999888'
const DEFAULT_CONDICION: CondicionImpositiva = 'CONSUMIDOR_FINAL'
const DEFAULT_CONCEPTO: Concepto = 'PRODUCTOS'

const createDefaultItem = (): FacturaItem => ({
  descripcion: 'Producto de prueba',
  cantidad: 1,
  precioUnitario: 1000,
  iva: 'IVA_0'
})

export default function EmitirForm() {
  const [currentStep, setCurrentStep] = useState<StepEmitir>(StepEmitir.CONFIGURACION)
  const emitRequest = useAsyncRequest<FacturaRespuesta>()
  const [result, setResult] = useState<FacturaRespuesta | null>(null)

  const [pv, setPv] = useState<number>(DEFAULT_PUNTO_VENTA)
  const {
    data: puntosVenta,
    load: loadPuntosVenta
  } = useAsyncResource<PuntoVenta[]>([])
  const [puntosVentaError, setPuntosVentaError] = useState<string | null>(null)

  const [docTipo, setDocTipo] = useState<DocumentoTipo>(DEFAULT_DOC_TIPO)
  const [docNro, setDocNro] = useState(DEFAULT_DOC_NRO)
  const [cond, setCond] = useState<CondicionImpositiva>(DEFAULT_CONDICION)
  const [concepto, setConcepto] = useState<Concepto>(DEFAULT_CONCEPTO)
  const [fechaEmision, setFechaEmision] = useState(today)
  const [items, setItems] = useState<FacturaItem[]>([createDefaultItem()])
  const [servicioDesde, setServicioDesde] = useState(today)
  const [servicioHasta, setServicioHasta] = useState(today)
  const [vencimientoPago, setVencimientoPago] = useState(today)

  useEffect(() => {
    let active = true
    const fetchPuntosVenta = async () => {
      const result = await loadPuntosVenta(() => AfipService.puntosVenta())
      if (!active) return
      if (result.ok) {
        const listado = result.data
        setPuntosVentaError(null)
        if (listado.length > 0) {
          setPv(prev => (listado.some(item => item.nro === prev) ? prev : listado[0].nro))
        }
      } else {
        const message = result.error instanceof Error ? result.error.message : 'No pudimos cargar los puntos de venta'
        setPuntosVentaError(message)
      }
    }
    void fetchPuntosVenta()
    return () => { active = false }
  }, [loadPuntosVenta])

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => {
      const cantidad = Number.isFinite(item.cantidad) ? item.cantidad : 0
      const precioUnitario = Number.isFinite(item.precioUnitario) ? item.precioUnitario : 0
      return sum + cantidad * precioUnitario
    }, 0),
    [items]
  )
  const requiresCustomerIdentification = cond !== 'CONSUMIDOR_FINAL' || totalAmount >= CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD
  const requiresServicePeriod = concepto !== 'PRODUCTOS'

  const addItem = useCallback(() => {
    setItems(prev => ([...prev, { descripcion: '', cantidad: 1, precioUnitario: 0, iva: 'IVA_0' }]))
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index))
  }, [])

  const updateItem = useCallback(
    (index: number, patch: Partial<Pick<FacturaItem, 'descripcion' | 'cantidad' | 'precioUnitario'>>) => {
      setItems(prev => prev.map((curr, idx) => (idx === index ? { ...curr, ...patch } : curr)))
    },
    []
  )

  const volverAtras = () => {
    setCurrentStep(prev => (prev > StepEmitir.CONFIGURACION ? (prev - 1) as StepEmitir : prev))
  }

  const emitirNuevoComprobante = () => {
    setCurrentStep(StepEmitir.CONFIGURACION)
    emitRequest.resetState()
    setResult(null)
    setPv(DEFAULT_PUNTO_VENTA)
    setPuntosVentaError(null)
    setDocTipo(DEFAULT_DOC_TIPO)
    setDocNro(DEFAULT_DOC_NRO)
    setCond(DEFAULT_CONDICION)
    setConcepto(DEFAULT_CONCEPTO)
    setFechaEmision(today)
    setItems([createDefaultItem()])
    setServicioDesde(today)
    setServicioHasta(today)
    setVencimientoPago(today)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep !== StepEmitir.ITEMS) {
      setCurrentStep(prev => (prev < StepEmitir.ITEMS ? (prev + 1) as StepEmitir : prev))
      return
    }

    emitRequest.setError(null)
    setResult(null)
    try {
      const validationError = validateAfipDates({ requiresServicePeriod, fechaEmision, servicioDesde, servicioHasta, vencimientoPago })
      if (validationError) {
        emitRequest.setError(new Error(validationError))
        return
      }
      const solicitud: FacturaSolicitud = {
        externalId: crypto.randomUUID(),
        puntoVenta: pv,
        fechaEmision: fechaEmision || today,
        concepto,
        receptor: {
          condicionImpositiva: cond,
          documentoTipo: requiresCustomerIdentification ? docTipo : 'SIN_IDENTIFICAR',
          documentoNumero: requiresCustomerIdentification ? docNro : '00000000',
          pais: 'AR'
        },
        items: items.map(item => ({
          descripcion: item.descripcion,
          cantidad: Number.isFinite(item.cantidad) && item.cantidad > 0 ? item.cantidad : 1,
          precioUnitario: Number.isFinite(item.precioUnitario) && item.precioUnitario >= 0 ? item.precioUnitario : 0,
          iva: item.iva
        })),
        moneda: 'PES',
        cotizacion: 1,
        ...(requiresServicePeriod
          ? {
            servicioDesde: servicioDesde || today,
            servicioHasta: servicioHasta || servicioDesde || today,
            vencimientoPago: vencimientoPago || servicioHasta || today
          }
          : {})
      }
      const payload = { emisor: 'MONOTRIBUTO' as const, solicitud }
      const requestResult = await emitRequest.run(() => AfipService.emitir(payload))
      if (!requestResult.ok) {
        return
      }
      const response = requestResult.data
      if (response.resultado !== 'A') {
        const rejectionMessage = describeAfipRejection(response)
        setResult(null)
        emitRequest.setError(new Error(rejectionMessage))
        return
      }
      setResult(response)
    } catch (requestError: any) {
      emitRequest.setError(requestError?.message || String(requestError))
    }
  }

  return (
    <IonCard className="card space-y-6">
      <IonCardContent className="space-y-6">
        {result == null ? (
          <Fragment>
            <HeaderFormulario />
            <Header currentStep={currentStep} />

            {emitRequest.error == null && (
              <form onSubmit={onSubmit} className="space-y-6">
                {currentStep == StepEmitir.CONFIGURACION && (
                  <PrimerPaso
                    {...{
                      puntosVenta,
                      pv,
                      setPv,
                      puntosVentaError,
                      concepto,
                      setConcepto,
                      fechaEmision,
                      setFechaEmision,
                      requiresServicePeriod,
                      servicioDesde,
                      setServicioDesde,
                      servicioHasta,
                      setServicioHasta,
                      vencimientoPago,
                      setVencimientoPago
                    }}
                  />
                )}

                {currentStep == StepEmitir.DATOS_RECEPTOR && (
                  <SegundoPaso {...{ cond, setCond, requiresCustomerIdentification, docTipo, setDocTipo, docNro, setDocNro }} />
                )}

                {currentStep == StepEmitir.ITEMS && (
                  <TercerPaso {...{ items, addItem, removeItem, updateItem, totalAmount }} />
                )}

                <Footer {...{ loading: emitRequest.loading, currentStep, volverAtras }} />
              </form>
            )}
          </Fragment>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <SuccessLite title="Factura creada correctamente" subtitle={`CAE # ${result?.cae}`} />
            <IonButton type="button" onClick={emitirNuevoComprobante}>Emitir nuevo comprobante</IonButton>
          </div>
        )}

        <ErrorBox error={emitRequest.error} />
      </IonCardContent>
    </IonCard>
  )
}

const Header = ({ currentStep }: { currentStep: StepEmitir }) => {
  const steps: Step[] = [
    {
      title: 'Datos del comprobante',
      subtitle: 'Selecciona el punto de venta habilitado y define el concepto del comprobante.',
      isActive: currentStep == StepEmitir.CONFIGURACION
    },
    {
      title: 'Datos del receptor',
      subtitle: 'Completa la condicion impositiva del receptor.',
      isActive: currentStep == StepEmitir.DATOS_RECEPTOR
    },
    {
      title: 'Items',
      subtitle: 'Agrega los items al comprobante.',
      isActive: currentStep == StepEmitir.ITEMS
    }
  ]

  return (
    <div className="pb-6">
      <Steper steps={steps} />
    </div>
  )
}

const PrimerPaso = (props: PrimerPasoProps) => (
  <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <PuntoVentaField puntosVenta={props.puntosVenta} pv={props.pv} setPv={props.setPv} />
      <ConceptoField concepto={props.concepto} setConcepto={props.setConcepto} />
      <FechaComprobanteField fechaEmision={props.fechaEmision} setFechaEmision={props.setFechaEmision} />
    </div>

    <PuntosVentaError message={props.puntosVentaError} />

    {props.requiresServicePeriod && (
      <ServicePeriodFields
        servicioDesde={props.servicioDesde}
        setServicioDesde={props.setServicioDesde}
        servicioHasta={props.servicioHasta}
        setServicioHasta={props.setServicioHasta}
        vencimientoPago={props.vencimientoPago}
        setVencimientoPago={props.setVencimientoPago}
      />
    )}
  </section>
)

const SegundoPaso = ({ cond, setCond, requiresCustomerIdentification, docTipo, setDocTipo, docNro, setDocNro }: SegundoPasoProps) => (
  <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <CondicionReceptorField cond={cond} setCond={setCond} />

      {requiresCustomerIdentification && (
        <DocumentoFields docTipo={docTipo} setDocTipo={setDocTipo} docNro={docNro} setDocNro={setDocNro} />
      )}
    </div>
  </section>
)

const TercerPaso = ({ items, addItem, removeItem, updateItem, totalAmount }: TercerPasoProps) => (
  <section className="space-y-4">
    <IonButton
      type="button"
      fill="outline"
      size="small"
      onClick={addItem}
    >
      <IonIcon icon={addOutline} slot="start" />
      Agregar item
    </IonButton>

    <div className="space-y-3">
      {items.map((item, index) => (
        <ItemCard
          key={index}
          item={item}
          index={index}
          totalItems={items.length}
          onRemove={removeItem}
          onUpdate={updateItem}
        />
      ))}
    </div>

    <TotalSummary totalAmount={totalAmount} />
  </section>
)

const Footer = ({ loading, currentStep, volverAtras }: FooterProps) => {
  const buttonText = currentStep !== StepEmitir.ITEMS
    ? 'Siguiente paso'
    : 'Emitir comprobante'

  return (
    <div className="flex flex-col-reverse gap-3 pt-5 md:flex-row md:items-center md:justify-end">
      <p className="caption-copy">Se genera un identificador externo automatico para seguir la solicitud enviada a AFIP.</p>
      <div className="flex-1" />
      <ActionButtonsGroup
        className="flex flex-col gap-3 md:flex-row"
        secondary={{
          label: 'Volver',
          fill: 'outline',
          onClick: volverAtras,
          disabled: loading
        }}
        primary={{
          label: buttonText,
          type: 'submit',
          loading,
          loadingLabel: 'Emitiendo...',
          showLoadingSpinner: false
        }}
      />
    </div>
  )
}

const HeaderFormulario = () => (
  <header className="space-y-1">
    <span className="text-[1.5rem] text-slate-900  ">Nueva factura</span>
  </header>
)

const describeAfipRejection = (resp: FacturaRespuesta): string => {
  const reasons = [...(resp.errores ?? []), ...(resp.observaciones ?? [])]
    .map(item => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0))
  const detail = reasons.length ? reasons.join(' - ') : 'Verifica la fecha, numeracion y los datos informados.'
  return `AFIP rechazo la solicitud (${resp.resultado}). ${detail}`
}

type DateValidationInput = {
  requiresServicePeriod: boolean
  fechaEmision?: string
  servicioDesde?: string
  servicioHasta?: string
  vencimientoPago?: string
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const validateAfipDates = (input: DateValidationInput): string | null => {
  if (!isIsoDate(input.fechaEmision)) {
    return 'Ingresa una fecha de comprobante valida.'
  }
  if (!input.requiresServicePeriod) {
    return null
  }
  if (!isIsoDate(input.servicioDesde) || !isIsoDate(input.servicioHasta)) {
    return 'Completa las fechas Desde y Hasta del servicio.'
  }
  if (compareIsoDates(input.servicioHasta, input.servicioDesde) < 0) {
    return 'La fecha Hasta no puede ser anterior a Desde.'
  }
  if (compareIsoDates(input.servicioHasta, input.fechaEmision) > 0) {
    return 'La fecha Hasta no puede ser posterior a la fecha del comprobante.'
  }
  if (!isIsoDate(input.vencimientoPago)) {
    return 'Ingresa un vencimiento de pago valido.'
  }
  const latestReference = maxIsoDate(input.servicioHasta, input.fechaEmision)
  if (compareIsoDates(input.vencimientoPago, latestReference) < 0) {
    return 'El vencimiento debe ser igual o posterior al fin del servicio y a la fecha del comprobante.'
  }
  return null
}

const isIsoDate = (value?: string | null): value is string => (
  Boolean(value && ISO_DATE_REGEX.test(value))
)

const compareIsoDates = (a: string, b: string): number => (
  a.localeCompare(b)
)

const maxIsoDate = (a: string, b: string): string => (
  compareIsoDates(a, b) >= 0 ? a : b
)
