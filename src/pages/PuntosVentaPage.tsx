import { useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { PuntoVenta } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import PuntosVentaTable from '../components/PuntosVentaTable'
import { useOnboarding } from '../contexts/OnboardingContext'
import OnboardingReminder from '../components/OnboardingReminder'

export default function PuntosVentaPage(){
  const { status: onboarding, loading: onboardingLoading, error: onboardingError } = useOnboarding()
  const [data, setData] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>()

  useEffect(()=>{
    if (!onboarding?.configured) return
    setLoading(true)
    setError(undefined)
    AfipService.puntosVenta()
      .then(setData)
      .catch(setError)
      .finally(()=>setLoading(false))
  },[onboarding?.configured])

  if (onboardingLoading) {
    return <Loader />
  }

  if (onboardingError) {
    return <ErrorBox error={onboardingError} />
  }

  if (!onboarding?.configured) {
    return <OnboardingReminder feature="el módulo de puntos de venta" />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Puntos de venta</h1>
      {loading && <Loader/>}
      {error && <ErrorBox error={error}/>}
      {!loading && !error && <PuntosVentaTable data={data} />}
    </div>
  )
}
