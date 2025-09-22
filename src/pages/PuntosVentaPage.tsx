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
      {!loading && !error && <PuntosVentaTable data={data} />}
    </div>
  )
}