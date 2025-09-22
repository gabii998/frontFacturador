import { useState } from 'react'
import type { FacturaSolicitud, CondicionImpositiva, DocumentoTipo } from '../models/afip'
import { AfipService } from '../services/afip'

const today = new Date().toISOString().slice(0,10)

export default function EmitirForm(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>(undefined)
  const [result, setResult] = useState<any>(null)

  const [pv, setPv] = useState(2)
  const [docTipo, setDocTipo] = useState<DocumentoTipo>('DNI')
  const [docNro, setDocNro] = useState('28999888')
  const [cond, setCond] = useState<CondicionImpositiva>('CONSUMIDOR_FINAL')
  const [desc, setDesc] = useState('Producto de prueba')
  const [precio, setPrecio] = useState(1000)
  const [iva, setIva] = useState('IVA_0')

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    setLoading(true); setError(undefined); setResult(null)
    try {
      const solicitud: FacturaSolicitud = {
        externalId: crypto.randomUUID(),
        puntoVenta: pv,
        fechaEmision: today,
        concepto: 'PRODUCTOS',
        receptor: {
          condicionImpositiva: cond,
          documentoTipo: docTipo,
          documentoNumero: docNro,
          pais: 'AR'
        },
        items: [ { descripcion: desc, cantidad: 1, precioUnitario: Number(precio), iva } ],
        moneda: 'PES',
        cotizacion: 1
      }
      const payload = { emisor: 'MONOTRIBUTO', solicitud }
      const r = await AfipService.emitir(payload)
      setResult(r)
    } catch (err:any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Emitir (demo Factura C)</h2>
      <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Punto de venta</label>
          <input className="input" type="number" value={pv} onChange={e=>setPv(Number(e.target.value))}/>
        </div>
        <div>
          <label className="label">Documento</label>
          <div className="flex gap-2">
            <select className="input w-40" value={docTipo} onChange={e=>setDocTipo(e.target.value as any)}>
              <option value="DNI">DNI</option>
              <option value="CUIT">CUIT</option>
              <option value="SIN_IDENTIFICAR">SIN_IDENTIFICAR</option>
            </select>
            <input className="input" value={docNro} onChange={e=>setDocNro(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Condición IVA receptor</label>
          <select className="input" value={cond} onChange={e=>setCond(e.target.value as any)}>
            <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
            <option value="MONOTRIBUTO">Monotributo</option>
            <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
            <option value="EXENTO">Exento</option>
            <option value="NO_ALCANZADO">No alcanzado</option>
            <option value="SUJETO_NO_CATEGORIZADO">Sujeto no categorizado</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Ítem</label>
          <div className="grid md:grid-cols-3 gap-2">
            <input className="input" placeholder="Descripción" value={desc} onChange={e=>setDesc(e.target.value)} />
            <input className="input" type="number" placeholder="Precio" value={precio} onChange={e=>setPrecio(Number(e.target.value))} />
            <select className="input" value={iva} onChange={e=>setIva(e.target.value)}>
              <option value="IVA_0">IVA_0 (Factura C)</option>
              <option value="IVA_21">IVA_21 (A/B)</option>
              <option value="IVA_105">IVA_105</option>
            </select>
          </div>
        </div>
        <div className="md:col-span-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Emitiendo...' : 'Emitir'}
          </button>
        </div>
      </form>

      {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">{error}</div>}
      {result && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-xl border border-green-200">
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}