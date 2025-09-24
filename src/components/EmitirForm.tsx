import { useEffect, useMemo, useState } from 'react'
import type { FacturaSolicitud, CondicionImpositiva, DocumentoTipo, PuntoVenta, FacturaItem, Concepto, FacturaEmitida } from '../models/afip'
import { AfipService } from '../services/afip'
import { CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD } from '../config/afip'
import ErrorBox from './ErrorBox'

const today = new Date().toISOString().slice(0,10)

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2
})

export default function EmitirForm(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>(undefined)
  const [result, setResult] = useState<FacturaEmitida | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const [pv, setPv] = useState<number>(2)
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [puntosVentaError, setPuntosVentaError] = useState<string | null>(null)

  const [docTipo, setDocTipo] = useState<DocumentoTipo>('DNI')
  const [docNro, setDocNro] = useState('28999888')
  const [cond, setCond] = useState<CondicionImpositiva>('CONSUMIDOR_FINAL')
  const [concepto, setConcepto] = useState<Concepto>('PRODUCTOS')
  const [items, setItems] = useState<FacturaItem[]>([
    { descripcion: 'Producto de prueba', cantidad: 1, precioUnitario: 1000, iva: 'IVA_0' }
  ])
  const [servicioDesde, setServicioDesde] = useState(today)
  const [servicioHasta, setServicioHasta] = useState(today)
  const [vencimientoPago, setVencimientoPago] = useState(today)

  useEffect(() => {
    let active = true
    async function fetchPuntosVenta(){
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

  const downloadFileName = useMemo(() => {
    if (!result) return 'factura.pdf'
    const pvFormatted = String(result.puntoVenta).padStart(4, '0')
    const numberFormatted = String(result.numero ?? 0).padStart(8, '0')
    return `factura-${pvFormatted}-${numberFormatted}.pdf`
  }, [result])

  useEffect(() => {
    if (!result?.pdfBase64) {
      setPdfUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    const url = createPdfUrl(result.pdfBase64)
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return url
    })
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [result?.pdfBase64])

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true); setError(undefined); setResult(null)
    try {
      const solicitud: FacturaSolicitud = {
        externalId: crypto.randomUUID(),
        puntoVenta: pv,
        fechaEmision: today,
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
      setResult(r)
    } catch (err:any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-6">
      <header className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Demo WSFE</span>
        <h2 className="text-xl font-semibold text-slate-900">Datos del comprobante</h2>
        <p className="text-sm text-slate-600">Completá la información necesaria para emitir el comprobante y enviar la solicitud al servicio de AFIP.</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Paso 1</span>
            <h3 className="mt-1 text-base font-semibold text-slate-800">Configuración de AFIP</h3>
            <p className="text-xs text-slate-500">Seleccioná el punto de venta habilitado y definí el concepto del comprobante a emitir.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Punto de venta</label>
              {puntosVenta.length > 0 ? (
                <select
                  className="input"
                  value={pv}
                  onChange={e => setPv(Number(e.target.value))}
                >
                  {puntosVenta.map(item => (
                    <option key={item.nro} value={item.nro}>
                      PV {item.nro} · {item.emisionTipo}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="input"
                  type="number"
                  value={pv}
                  onChange={e => setPv(Number(e.target.value))}
                  placeholder="Ingresá el punto de venta"
                />
              )}
              {puntosVentaError && (
                <p className="mt-1 text-xs text-amber-600">{puntosVentaError}. Podés cargarlo manualmente.</p>
              )}
            </div>
            <div>
              <label className="label">Concepto</label>
              <select className="input" value={concepto} onChange={e=>setConcepto(e.target.value as Concepto)}>
                <option value="PRODUCTOS">Productos</option>
                <option value="SERVICIOS">Servicios</option>
                <option value="AMBOS">Productos y Servicios</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Paso 2</span>
            <h3 className="mt-1 text-base font-semibold text-slate-800">Datos del receptor</h3>
            <p className="text-xs text-slate-500">Configurá la condición impositiva y completá el documento solo cuando la normativa lo requiera.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Condición IVA receptor</label>
              <select
                className="input"
                value={cond}
                onChange={e=>setCond(e.target.value as CondicionImpositiva)}
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
                  <select className="input md:w-40" value={docTipo} onChange={e=>setDocTipo(e.target.value as DocumentoTipo)}>
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="SIN_IDENTIFICAR">SIN_IDENTIFICAR</option>
                  </select>
                  <input className="input" value={docNro} onChange={e=>setDocNro(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </section>

        {requiresServicePeriod && (
          <section className="space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Paso 3</span>
              <h3 className="mt-1 text-base font-semibold text-slate-800">Período del servicio</h3>
              <p className="text-xs text-slate-500">Informá las fechas de prestación y el vencimiento de pago para comprobantes de servicios o mixtos.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <span className="text-xs text-slate-500">Desde</span>
                <input
                  className="input"
                  type="date"
                  value={servicioDesde}
                  onChange={e => setServicioDesde(e.target.value)}
                />
              </div>
              <div>
                <span className="text-xs text-slate-500">Hasta</span>
                <input
                  className="input"
                  type="date"
                  value={servicioHasta}
                  onChange={e => setServicioHasta(e.target.value)}
                />
              </div>
              <div>
                <span className="text-xs text-slate-500">Vencimiento de pago</span>
                <input
                  className="input"
                  type="date"
                  value={vencimientoPago}
                  onChange={e => setVencimientoPago(e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Paso {requiresServicePeriod ? 4 : 3}</span>
              <h3 className="mt-1 text-base font-semibold text-slate-800">Detalle de ítems</h3>
            </div>
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
        </section>

        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-500">Se genera un identificador externo automático para seguir la solicitud enviada a AFIP.</p>
          <button className="btn btn-primary md:w-auto" type="submit" disabled={loading}>
            {loading ? 'Emitiendo…' : 'Emitir comprobante'}
          </button>
        </div>
      </form>

      <ErrorBox error={error} />
      {result && (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">Comprobante generado</span>
            <span className="text-xs text-emerald-600">Respuesta AFIP</span>
          </div>
          {pdfUrl && (
            <a
              className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm hover:bg-emerald-50"
              href={pdfUrl}
              download={downloadFileName}
              target="_blank"
              rel="noopener"
            >
              Descargar PDF
            </a>
          )}
          <pre className="whitespace-pre-wrap text-xs text-emerald-800">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

function createPdfUrl(base64: string): string {
  const byteArray = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
  const blob = new Blob([byteArray], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
