import { Fragment, useEffect, useMemo, useState } from 'react'
import type { FacturaSolicitud, CondicionImpositiva, DocumentoTipo, PuntoVenta, FacturaItem, Concepto, FacturaRespuesta } from '../models/afip'
import { AfipService } from '../services/afip'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'
import ErrorBox from './ErrorBox'
import { FooterProps, PrimerPasoProps, SegundoPasoProps, StepEmitir, TercerPasoProps } from '../props/EmitirProps'
import { Step } from '../props/Step'
import Steper from './Steper'
import { SuccessLite } from './Sucess'

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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const [pv, setPv] = useState<number>(2)
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [puntosVentaError, setPuntosVentaError] = useState<string | null>(null)

  const [docTipo, setDocTipo] = useState<DocumentoTipo>('DNI')
  const [docNro, setDocNro] = useState('28999888')
  const [cond, setCond] = useState<CondicionImpositiva>('CONSUMIDOR_FINAL')
  const [concepto, setConcepto] = useState<Concepto>('PRODUCTOS')
  const [fechaEmision, setFechaEmision] = useState(today)
  const [items, setItems] = useState<FacturaItem[]>([
    { descripcion: 'Producto de prueba', cantidad: 1, precioUnitario: 1000, iva: 'IVA_0' }
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
    console.log("volver atras")
    setCurrentStep(prev =>
      prev > StepEmitir.CONFIGURACION ? (prev - 1) as StepEmitir : prev
    );
  }

  const emitirNuevoComprobante = () => {
    setCurrentStep(StepEmitir.CONFIGURACION)
    setLoading(false)
    setError(undefined)
    setResult(null)
    setPdfUrl(null)
    setPv(2)
    setPuntosVentaError(null)
    setDocTipo('DNI')
    setDocNro('28999888')
    setCond('CONSUMIDOR_FINAL')
    setConcepto('PRODUCTOS')
    setFechaEmision(today)
    setItems([{ descripcion: 'Producto de prueba', cantidad: 1, precioUnitario: 1000, iva: 'IVA_0' }])
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
        if (r.resultado !== 'A') {
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
      // si no es el último, incremento
      const value = prev < StepEmitir.RESULTADO ? (prev + 1) as StepEmitir : prev;
      console.log(prev)
      console.log(value)
      return value;
    });
    }
  }

  return (
    <div className="card space-y-6">
      {result == null ? <Fragment>
        <HeaderFormulario />
      <Header currentStep={currentStep} />

      {error == null && <form onSubmit={onSubmit} className="space-y-6">
        {currentStep == StepEmitir.CONFIGURACION &&
          <PrimerPaso {...{ puntosVenta, pv, setPv, puntosVentaError, concepto, setConcepto, fechaEmision, setFechaEmision, requiresServicePeriod, servicioDesde, setServicioDesde, servicioHasta, setServicioHasta, vencimientoPago, setVencimientoPago }} />
        }

        {currentStep == StepEmitir.DATOS_RECEPTOR &&
          <SegundoPaso {...{ cond, setCond, requiresCustomerIdentification, docTipo, setDocTipo, docNro, setDocNro }} />
        }

        {currentStep == StepEmitir.ITEMS &&
          <TercerPaso {...{ items, setItems, totalAmount }} />
        }

        <Footer {...{ loading, currentStep, volverAtras }} />
      </form>}

      
        </Fragment> : (
          <div className="flex flex-col items-center gap-4">
            <SuccessLite title='Factura creada correctamente' subtitle={`CAE # ${result?.cae}`}/>
            <button type="button" className="btn btn-primary" onClick={emitirNuevoComprobante}>
              Emitir nuevo comprobante
            </button>
          </div>
        )}
      

      <ErrorBox error={error} />
      
    </div>
  )
}

const Header = ({ currentStep }: { currentStep: StepEmitir }) => {
  const steps: Step[] = [
    { title: "Datos del comprobante", subtitle: "Seleccioná el punto de venta habilitado y definí el concepto del comprobante.", isActive: currentStep == StepEmitir.CONFIGURACION },
    { title: "Datos del Receptor", subtitle: "Completá la condicion impositiva del receptor.", isActive: currentStep == StepEmitir.DATOS_RECEPTOR },
    { title: "Items", subtitle: "Agregá los items al comprobante.", isActive: currentStep == StepEmitir.ITEMS }
  ]

  return (<div className='pb-6'>
    <Steper steps={steps} />
  </div>)
}

const PrimerPaso = (props: PrimerPasoProps) => {
  return (<section className="space-y-4">

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div>
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
      <div>
        <label className="label">Concepto</label>
        <select className="input" value={props.concepto} onChange={e => props.setConcepto(e.target.value as Concepto)}>
          <option value="PRODUCTOS">Productos</option>
          <option value="SERVICIOS">Servicios</option>
          <option value="AMBOS">Productos y Servicios</option>
        </select>
      </div>
      <div>
        <label className="label">Fecha del comprobante</label>
        <input
          className="input"
          type="date"
          value={props.fechaEmision}
          onChange={e => props.setFechaEmision(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-500">AFIP exige que la fecha sea mayor o igual al período informado.</p>
      </div>
    </div>
    {props.requiresServicePeriod && (
      <section className="space-y-4">
        <div>
          <h3 className="mt-1 text-base font-semibold text-slate-800">Período del servicio</h3>
          <p className="text-xs text-slate-500">Informá las fechas de prestación y el vencimiento de pago para comprobantes de servicios o mixtos.</p>
         
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <span className="text-xs text-slate-500">Desde</span>
            <input
              className="input"
              type="date"
              value={props.servicioDesde}
              onChange={e => props.setServicioDesde(e.target.value)}
            />
          </div>
          <div>
            <span className="text-xs text-slate-500">Hasta</span>
            <input
              className="input"
              type="date"
              value={props.servicioHasta}
              onChange={e => props.setServicioHasta(e.target.value)}
            />
          </div>
          <div>
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
  return (<section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div>
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
        <div className="space-y-2">
          <label className="label">Documento</label>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <select className="input md:w-40" value={docTipo} onChange={e => setDocTipo(e.target.value as DocumentoTipo)}>
              <option value="DNI">DNI</option>
              <option value="CUIT">CUIT</option>
              <option value="SIN_IDENTIFICAR">SIN_IDENTIFICAR</option>
            </select>
            <input className="input" value={docNro} onChange={e => setDocNro(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  </section>)
}

const TercerPaso = ({ items, setItems, totalAmount }: TercerPasoProps) => {
  return (<section className="space-y-4">
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

      <button
        type="button"
        className="btn px-3 py-1.5 text-sm"
        onClick={() => setItems(prev => ([
          ...prev,
          { descripcion: '', cantidad: 1, precioUnitario: 0, iva: 'IVA_0' }
        ]))}
      >
        Agregar ítem
      </button>
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm shadow-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Ítem #{index + 1}</span>
            <span className="text-[11px] font-medium text-slate-500">Alícuota: IVA 0% (Factura C)</span>
            {items.length > 1 && (
              <button
                type="button"
                className="text-rose-600 hover:text-rose-500"
                onClick={() => setItems(prev => prev.filter((_, idx) => idx !== index))}
              >
                Quitar
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <div>
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
            <div>
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
            <div>
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
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
      <span>Total estimado</span>
      <span className="text-base font-semibold text-slate-900">{currencyFormatter.format(totalAmount)}</span>
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

  return (<div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-end pt-5">
    <p className="text-xs text-slate-500">Se genera un identificador externo automático para seguir la solicitud enviada a AFIP.</p>
    <div className='flex-1' />
    <button className="btn md:w-auto" type='button' onClick={volverAtras} disabled={loading}>
      Volver
    </button>
    <button className="btn btn-primary md:w-auto" type="submit" disabled={loading}>
      {buttonText}
    </button>
  </div>)
}

const HeaderFormulario = () => {
  return (<header className="space-y-1">
    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Nueva Factura</span>
    {/* <h2 className="text-xl font-semibold text-slate-900">Datos del comprobante</h2>
    <p className="text-sm text-slate-600">Completá la información necesaria para emitir el comprobante y enviar la solicitud al servicio de AFIP.</p> */}
  </header>)
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
