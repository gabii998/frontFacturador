import { useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'

export default function DashboardPage(){
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(undefined)
  const [pvs, setPvs] = useState<PuntoVenta[]>([])

  useEffect(()=>{
    AfipService.puntosVenta()
      .then(setPvs)
      .catch(setError)
      .finally(()=>setLoading(false))
  },[])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Bienvenido</h2>
        <p className="text-gray-600">Este panel consume el backend AFIP (HOMO/PROD según config).</p>
        <p className="text-gray-600 mt-2"><b>API:</b> {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}</p>
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Resumen</h3>
        {loading && <Loader/>}
        {error && <ErrorBox error={error}/>}
        {!loading && !error && (
          <ul className="text-gray-700 list-disc ml-5">
            <li>Puntos de venta visibles: <b>{pvs.length}</b></li>
          </ul>
        )}
      </div>
    </div>
  )
}