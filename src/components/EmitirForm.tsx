import { Fragment, useEffect, useMemo, useState } from 'react'
import type { FacturaSolicitud, CondicionImpositiva, DocumentoTipo, PuntoVenta, FacturaItem, Concepto, FacturaRespuesta } from '../models/afip'
import { AfipService } from '../services/afip'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'
import ErrorBox from './ErrorBox'
import { FooterProps, PrimerPasoProps, SegundoPasoProps, StepEmitir, TercerPasoProps } from '../props/EmitirProps'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClock,
  IconDeviceFloppy,
  IconFileInvoice,
  IconPlus,
  IconReceipt,
  IconTrash,
  IconUser,
} from '@tabler/icons-react'

const today = new Date().toISOString().slice(0, 10)

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

export default function EmitirForm() {
  const [currentStep, setCurrentStep] = useState<StepEmitir>(StepEmitir.CONFIGURACION);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(undefined)
  const [result, setResult] = useState<FacturaRespuesta | null>(null)

  const [pv, setPv] = useState<number>(2)
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [puntosVentaError, setPuntosVentaError] = useState<string | null>(null)

  const [docTipo, setDocTipo] = useState<DocumentoTipo>('DNI')
  const [docNro, setDocNro] = useState('28999888')
  const [cond, setCond] = useState<CondicionImpositiva>('CONSUMIDOR_FINAL')
  const [concepto, setConcepto] = useState<Concepto>('PRODUCTOS')
  const [fechaEmision, setFechaEmision] = useState(today)
  const [items, setItems] = useState<FacturaItem[]>([
    { descripcion: '', cantidad: 1, precioUnitario: 0, iva: 'IVA_0' }
  ])
  const [servicioDesde, setServicioDesde] = useState(today)
  const [servicioHasta, setServicioHasta] = useState(today)
  const [vencimientoPago, setVencimientoPago] = useState(today)

  useEffect(() => {
    let active = true
    async function fetchPuntosVenta() {
      try {
        const listado = await AfipService.puntosVenta()
        if (!active) return
        setPuntosVenta(listado)
        setPuntosVentaError(null)
        if (listado.length > 0) {
          setPv(prev => listado.some(item => item.nro === prev) ? prev : listado[0].nro)
        }
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'No pudimos cargar los puntos de venta'
        setPuntosVentaError(message)
      }
    }
    void fetchPuntosVenta()
    return () => { active = false }
  }, [])

  const totalAmount = useMemo(() => items.reduce((sum, item) => {
    const cantidad = Number.isFinite(item.cantidad) ? item.cantidad : 0
    const precioUnitario = Number.isFinite(item.precioUnitario) ? item.precioUnitario : 0
    return sum + cantidad * precioUnitario
  }, 0), [items])
  const requiresCustomerIdentification = cond !== 'CONSUMIDOR_FINAL' || totalAmount >= CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD
  const requiresServicePeriod = concepto !== 'PRODUCTOS'
  const dateValidationMessage = useMemo(
    () => validateAfipDates({ requiresServicePeriod, fechaEmision, servicioDesde, servicioHasta, vencimientoPago }),
    [requiresServicePeriod, fechaEmision, servicioDesde, servicioHasta, vencimientoPago]
  )

  const downloadFileName = useMemo(() => {
    if (!result) return 'factura.pdf'
    const pvFormatted = String(result.puntoVenta).padStart(4, '0')
    const numberFormatted = String(result.numero ?? 0).padStart(8, '0')
    return `factura-${pvFormatted}-${numberFormatted}.pdf`
  }, [result])

  // useEffect(() => {
  //   // if (!result?.pdfBase64) {
  //   //   setPdfUrl(prev => {
  //   //     if (prev) URL.revokeObjectURL(prev)
  //   //     return null
  //   //   })
  //   //   return
  //   // }
  //   // const url = createPdfUrl(result.pdfBase64)
  //   // setPdfUrl(prev => {
  //   //   if (prev) URL.revokeObjectURL(prev)
  //   //   return url
  //   // })
  //   return () => {
  //     URL.revokeObjectURL(url)
  //   }
  // }, [result?.pdfBase64])

  const volverAtras = () => {
    setCurrentStep(prev =>
      prev > StepEmitir.CONFIGURACION ? (prev - 1) as StepEmitir : prev
    );
  }

  const emitirNuevoComprobante = () => {
    setCurrentStep(StepEmitir.CONFIGURACION)
    setLoading(false)
    setError(undefined)
    setResult(null)
    setPv(2)
    setPuntosVentaError(null)
    setDocTipo('DNI')
    setDocNro('28999888')
    setCond('CONSUMIDOR_FINAL')
    setConcepto('PRODUCTOS')
    setFechaEmision(today)
    setItems([{ descripcion: '', cantidad: 1, precioUnitario: 0, iva: 'IVA_0' }])
    setServicioDesde(today)
    setServicioHasta(today)
    setVencimientoPago(today)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (currentStep == StepEmitir.ITEMS) {
      setLoading(true);
      setError(undefined);
      setResult(null)
      try {
        const validationError = validateAfipDates({ requiresServicePeriod, fechaEmision, servicioDesde, servicioHasta, vencimientoPago })
        if (validationError) {
          setError(new Error(validationError))
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
          ...(requiresServicePeriod ? {
            servicioDesde: servicioDesde || today,
            servicioHasta: servicioHasta || servicioDesde || today,
            vencimientoPago: vencimientoPago || servicioHasta || today
          } : {})
        }
        const payload = { emisor: 'MONOTRIBUTO' as const, solicitud }
        const r = await AfipService.emitir(payload)
        if (r.resultado !== 'A' && r.resultado !== 'QUEUED') {
          const rejectionMessage = describeAfipRejection(r)
          setResult(null)
          setError(new Error(rejectionMessage))
          return
        }
        setResult(r)
      } catch (err: any) {
        setError(err?.message || String(err))
      } finally {
        setLoading(false)
      }
    } else {
      setCurrentStep(prev => {
        return prev < StepEmitir.RESULTADO ? (prev + 1) as StepEmitir : prev;
      });
    }
  }

  return (
    <div className="invoice-flow">
      {result == null ? (
        <Fragment>
          <HeaderFormulario />
          <Header currentStep={currentStep} />

          {error == null && (
            <form onSubmit={onSubmit} className="invoice-flow__layout">
              <div className="invoice-flow__main">
                {currentStep == StepEmitir.CONFIGURACION &&
                  <PrimerPaso {...{ puntosVenta, pv, setPv, puntosVentaError, concepto, setConcepto, fechaEmision, setFechaEmision, requiresServicePeriod, servicioDesde, setServicioDesde, servicioHasta, setServicioHasta, vencimientoPago, setVencimientoPago }} />
                }

                {currentStep == StepEmitir.DATOS_RECEPTOR &&
                  <SegundoPaso {...{ cond, setCond, requiresCustomerIdentification, docTipo, setDocTipo, docNro, setDocNro }} />
                }

                {currentStep == StepEmitir.ITEMS &&
                  <TercerPaso {...{ items, setItems, totalAmount }} />
                }
              </div>

              <aside className="invoice-flow__summary">
                <div>
                  <span>Estado</span>
                  <strong>{loading ? 'Emitiendo' : 'Borrador'}</strong>
                </div>
                <div>
                  <span>Punto de venta</span>
                  <strong>PV {pv}</strong>
                </div>
                <div>
                  <span>Concepto</span>
                  <strong>{conceptoLabel(concepto)}</strong>
                </div>
                <div>
                  <span>Total estimado</span>
                  <strong>{currencyFormatter.format(totalAmount)}</strong>
                </div>
                <p>Al confirmar se inicia la emisión. El CAE puede demorar unos instantes y luego aparece en Comprobantes.</p>
              </aside>

              <Footer {...{ loading, currentStep, volverAtras }} />
            </form>
          )}
        </Fragment>
      ) : (
        <ResultPanel result={result} onReset={emitirNuevoComprobante} />
      )}

      <ErrorBox error={error} />
    </div>
  )
}

const Header = ({ currentStep }: { currentStep: StepEmitir }) => {
  const steps = [
    { title: "Comprobante", icon: IconReceipt },
    { title: "Receptor", icon: IconUser },
    { title: "Ítems", icon: IconFileInvoice }
  ]

  return (
    <ol className="invoice-progress">
      {steps.map((step, index) => {
        const Icon = step.icon
        const active = currentStep === index
        const complete = currentStep > index
        return (
          <li key={step.title} className={active ? 'is-active' : complete ? 'is-complete' : undefined}>
            <span>{complete ? <IconCheck /> : <Icon />}</span>
            <strong>{step.title}</strong>
          </li>
        )
      })}
    </ol>
  )
}

const PrimerPaso = (props: PrimerPasoProps) => {
  return (<section className="invoice-section">
    <SectionTitle
      title="Datos del comprobante"
      subtitle="Definí la base fiscal de la solicitud antes de cargar receptor e ítems."
    />

    <div className="invoice-fields invoice-fields--three">
      <div className="invoice-field">
        <label className="label">Punto de venta</label>
        {props.puntosVenta.length > 0 ? (
          <select
            className="input"
            value={props.pv}
            onChange={e => props.setPv(Number(e.target.value))}
          >
            {props.puntosVenta.map(item => (
              <option key={item.nro} value={item.nro}>
                PV {item.nro} · {item.emisionTipo}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="input"
            type="number"
            value={props.pv}
            onChange={e => props.setPv(Number(e.target.value))}
            placeholder="Ingresá el punto de venta"
          />
        )}
        {props.puntosVentaError && (
          <p className="mt-1 text-xs text-amber-600">{props.puntosVentaError}.</p>
        )}
      </div>
      <div className="invoice-field">
        <label className="label">Concepto</label>
        <select className="input" value={props.concepto} onChange={e => props.setConcepto(e.target.value as Concepto)}>
          <option value="PRODUCTOS">Productos</option>
          <option value="SERVICIOS">Servicios</option>
          <option value="AMBOS">Productos y Servicios</option>
        </select>
      </div>
      <div className="invoice-field">
        <label className="label">Fecha del comprobante</label>
        <input
          className="input"
          type="date"
          value={props.fechaEmision}
          onChange={e => props.setFechaEmision(e.target.value)}
        />
        <p className="invoice-help"><IconCalendar /> ARCA exige que la fecha respete el período informado.</p>
      </div>
    </div>
    {props.requiresServicePeriod && (
      <section className="invoice-subsection">
        <div>
          <h3>Período del servicio</h3>
          <p>Informá prestación y vencimiento de pago para comprobantes de servicios o mixtos.</p>
        </div>
        <div className="invoice-fields invoice-fields--three">
          <div className="invoice-field">
            <span className="text-xs text-slate-500">Desde</span>
            <input
              className="input"
              type="date"
              value={props.servicioDesde}
              onChange={e => props.setServicioDesde(e.target.value)}
            />
          </div>
          <div className="invoice-field">
            <span className="text-xs text-slate-500">Hasta</span>
            <input
              className="input"
              type="date"
              value={props.servicioHasta}
              onChange={e => props.setServicioHasta(e.target.value)}
            />
          </div>
          <div className="invoice-field">
            <span className="text-xs text-slate-500">Vencimiento de pago</span>
            <input
              className="input"
              type="date"
              value={props.vencimientoPago}
              onChange={e => props.setVencimientoPago(e.target.value)}
            />
          </div>
        </div>
      </section>
    )}
  </section>)
}

const SegundoPaso = ({ cond, setCond, requiresCustomerIdentification, docTipo, setDocTipo, docNro, setDocNro }: SegundoPasoProps) => {
  return (<section className="invoice-section">
    <SectionTitle
      title="Datos del receptor"
      subtitle="Identificá al cliente solo cuando la condición o el importe lo requieren."
    />
    <div className="invoice-fields invoice-fields--two">
      <div className="invoice-field">
        <label className="label">Condición IVA receptor</label>
        <select
          className="input"
          value={cond}
          onChange={e => setCond(e.target.value as CondicionImpositiva)}
        >
          <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
          <option value="MONOTRIBUTO">Monotributo</option>
          <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
          <option value="EXENTO">Exento</option>
          <option value="NO_ALCANZADO">No alcanzado</option>
          <option value="SUJETO_NO_CATEGORIZADO">Sujeto no categorizado</option>
        </select>
      </div>
      {requiresCustomerIdentification && (
        <div className="invoice-field">
          <label className="label">Documento</label>
          <div className="invoice-document-field">
            <select className="input md:w-40" value={docTipo} onChange={e => setDocTipo(e.target.value as DocumentoTipo)}>
              <option value="DNI">DNI</option>
              <option value="CUIT">CUIT</option>
              <option value="SIN_IDENTIFICAR">SIN_IDENTIFICAR</option>
            </select>
            <input className="input" value={docNro} onChange={e => setDocNro(e.target.value)} />
          </div>
        </div>
      )}
      {!requiresCustomerIdentification && (
        <div className="invoice-inline-note">
          <IconUser />
          <span>No se solicitará documento para consumidor final bajo el umbral configurado.</span>
        </div>
      )}
    </div>
  </section>)
}

const TercerPaso = ({ items, setItems, totalAmount }: TercerPasoProps) => {
  return (<section className="invoice-section">
    <div className="invoice-section__head">
      <SectionTitle
        title="Ítems del comprobante"
        subtitle="Cargá conceptos, cantidades e importes. El total se recalcula automáticamente."
      />
      <button
        type="button"
        className="btn invoice-add-item"
        onClick={() => setItems(prev => ([
          ...prev,
          { descripcion: '', cantidad: 1, precioUnitario: 0, iva: 'IVA_0' }
        ]))}
      >
        <IconPlus />
        Agregar ítem
      </button>
    </div>
    <div className="invoice-items">
      {items.map((item, index) => (
        <div key={index} className="invoice-item">
          <div className="invoice-item__meta">
            <span>Ítem {index + 1}</span>
            <small>IVA 0% para factura C</small>
            {items.length > 1 && (
              <button
                type="button"
                className="invoice-item__remove"
                onClick={() => setItems(prev => prev.filter((_, idx) => idx !== index))}
                aria-label={`Quitar ítem ${index + 1}`}
              >
                <IconTrash />
              </button>
            )}
          </div>
          <div className="invoice-item__fields">
            <div className="invoice-field">
              <label className="label">Descripción</label>
              <input
                className="input py-2 text-sm"
                value={item.descripcion}
                onChange={e => {
                  const value = e.target.value
                  setItems(prev => prev.map((curr, idx) => idx === index ? { ...curr, descripcion: value } : curr))
                }}
              />
            </div>
            <div className="invoice-field">
              <label className="label">Cantidad</label>
              <input
                className="input py-2 text-sm"
                type="number"
                min={0}
                step="0.01"
                value={item.cantidad}
                onChange={e => {
                  const value = Number(e.target.value)
                  setItems(prev => prev.map((curr, idx) => idx === index ? { ...curr, cantidad: Number.isNaN(value) ? 0 : value } : curr))
                }}
              />
            </div>
            <div className="invoice-field">
              <label className="label">Precio unitario</label>
              <input
                className="input py-2 text-sm"
                type="number"
                min={0}
                step="0.01"
                value={item.precioUnitario}
                onChange={e => {
                  const value = Number(e.target.value)
                  setItems(prev => prev.map((curr, idx) => idx === index ? { ...curr, precioUnitario: Number.isNaN(value) ? 0 : value } : curr))
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="invoice-total">
      <span>Total estimado</span>
      <strong>{currencyFormatter.format(totalAmount)}</strong>
    </div>
  </section>)
}

const Footer = ({ loading, currentStep, volverAtras }: FooterProps) => {
  const buttonText =
    loading
      ? "Emitiendo…"
      : currentStep !== StepEmitir.ITEMS
        ? "Siguiente paso"
        : "Emitir comprobante";

  return (<div className="invoice-footer">
    <p />
    <button className="btn md:w-auto" type='button' onClick={volverAtras} disabled={loading || currentStep === StepEmitir.CONFIGURACION}>
      <IconArrowLeft />
      Volver
    </button>
    <button className="btn btn-primary md:w-auto" type="submit" disabled={loading}>
      {buttonText}
      {currentStep !== StepEmitir.ITEMS ? <IconArrowRight /> : <IconDeviceFloppy />}
    </button>
  </div>)
}

const HeaderFormulario = () => {
  return (<header className="invoice-flow__header">
    <div>
      <span>Nueva solicitud</span>
      <h1>Emitir factura</h1>
      <p>Completá los datos mínimos y dejá que el proceso de emisión resuelva el CAE en segundo plano.</p>
    </div>
  </header>)
}

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="invoice-section-title">
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
)

const ResultPanel = ({ result, onReset }: { result: FacturaRespuesta; onReset: () => void }) => {
  const queued = result.resultado === 'QUEUED'
  return (
    <div className="invoice-result">
      <div className="invoice-result__icon">
        {queued ? <IconClock /> : <IconCheck />}
      </div>
      <span>{queued ? 'Emisión iniciada' : 'Comprobante emitido'}</span>
      <h2>{queued ? 'Factura en proceso de emisión' : 'Factura creada correctamente'}</h2>
      <p>
        {queued
          ? 'Estamos procesando la emisión. Vas a poder ver el estado y los intentos en Comprobantes.'
          : `CAE # ${result.cae}`}
      </p>
      {result.externalId && (
        <code>{result.externalId}</code>
      )}
      <button type="button" className="btn btn-primary" onClick={onReset}>
        Emitir otra factura
      </button>
    </div>
  )
}

const conceptoLabel = (concepto: Concepto) => {
  if (concepto === 'SERVICIOS') return 'Servicios'
  if (concepto === 'AMBOS') return 'Productos y servicios'
  return 'Productos'
}

const describeAfipRejection = (resp: FacturaRespuesta): string => {
  const reasons = [...(resp.errores ?? []), ...(resp.observaciones ?? [])]
    .map(item => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0))
  const detail = reasons.length ? reasons.join(' · ') : 'Verificá la fecha, numeración y los datos informados.'
  return `AFIP rechazó la solicitud (${resp.resultado}). ${detail}`
}

type DateValidationInput = {
  requiresServicePeriod: boolean
  fechaEmision?: string
  servicioDesde?: string
  servicioHasta?: string
  vencimientoPago?: string
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateAfipDates(input: DateValidationInput): string | null {
  if (!isIsoDate(input.fechaEmision)) {
    return 'Ingresá una fecha de comprobante válida.'
  }
  if (!input.requiresServicePeriod) {
    return null
  }
  if (!isIsoDate(input.servicioDesde) || !isIsoDate(input.servicioHasta)) {
    return 'Completá las fechas Desde y Hasta del servicio.'
  }
  if (compareIsoDates(input.servicioHasta, input.servicioDesde) < 0) {
    return 'La fecha “Hasta” no puede ser anterior a “Desde”.'
  }
  if (compareIsoDates(input.servicioHasta, input.fechaEmision) > 0) {
    return 'La fecha “Hasta” no puede ser posterior a la fecha del comprobante.'
  }
  if (!isIsoDate(input.vencimientoPago)) {
    return 'Ingresá un vencimiento de pago válido.'
  }
  const latestReference = maxIsoDate(input.servicioHasta, input.fechaEmision)
  if (compareIsoDates(input.vencimientoPago, latestReference) < 0) {
    return 'El vencimiento debe ser igual o posterior al fin del servicio y a la fecha del comprobante.'
  }
  return null
}

function isIsoDate(value?: string | null): value is string {
  return Boolean(value && ISO_DATE_REGEX.test(value))
}

function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b)
}

function maxIsoDate(a: string, b: string): string {
  return compareIsoDates(a, b) >= 0 ? a : b
}

function createPdfUrl(base64: string): string {
  const byteArray = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
