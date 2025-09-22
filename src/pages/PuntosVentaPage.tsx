import { useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'

export default function PuntosVentaPage(){
  const [data, setData] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  useEffect(()=>{
    setLoading(true)
    setError(undefined)
    AfipService.puntosVenta()
      .then(setData)
      .catch(setError)
      .finally(()=>setLoading(false))
  },[])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Puntos de venta</h1>
      {loading && <Loader/>}
      {error && <ErrorBox error={error}/>}
      {!loading && !error && (
        data.length > 0 ? (
          <PuntosVentaTable data={data} />
        ) : (
          <div className="card flex flex-col items-center gap-5 py-12 text-slate-500">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-inner">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 text-blue-500"
              >
                <rect x="16" y="26" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="3" fill="white" />
                <path d="M20 26v-6c0-3 2.4-5.5 5.5-5.5H30l3 6h13c3 0 5.5 2.4 5.5 5.5V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="white" />
                <path d="M46 18h-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <circle cx="26" cy="38" r="3" fill="currentColor" />
                <path d="M32 43h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M32 50h16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M18 18l28 28" stroke="#F87171" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-slate-700">Sin puntos de venta disponibles</h2>
              <p className="text-sm leading-relaxed">
                AFIP todavía no publicó puntos de venta para tu CUIT. En cuanto se habiliten, los vas a ver acá mismo.
                Revisá tu portal de AFIP o volvé a intentarlo más tarde.
              </p>
            </div>
          </div>
        )
      )}
    </div>
  )
}
