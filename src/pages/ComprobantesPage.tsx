import { useEffect, useState } from 'react'
import { AfipService } from '../services/afip'
import type { ComprobanteEmitido } from '../models/afip'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import ComprobantesTable from '../components/ComprobantesTable'
import { useOnboarding } from '../contexts/OnboardingContext'
import OnboardingReminder from '../components/OnboardingReminder'

export default function ComprobantesPage(){
  const { status: onboarding, loading: onboardingLoading, error: onboardingError } = useOnboarding()
  const [pv, setPv] = useState(2)
  const [tipo, setTipo] = useState(11) // Factura C
  const [limite, setLimite] = useState(20)
  const [data, setData] = useState<ComprobanteEmitido[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()

  async function fetchData(){
    if (!onboarding?.configured) return
    setLoading(true); setError(undefined)
    try {
      const res = await AfipService.listar(pv, tipo, { limite })
      setData(res)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ if (onboarding?.configured) void fetchData() }, [onboarding?.configured])

  if (onboardingLoading) {
    return <Loader />
  }

  if (onboardingError) {
    return <ErrorBox error={onboardingError} />
  }

  if (!onboarding?.configured) {
    return <OnboardingReminder feature="el módulo de comprobantes" />
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comprobantes</h1>
      <div className="card">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">PV</label>
            <input className="input" type="number" value={pv} onChange={e=>setPv(Number(e.target.value))}/>
          </div>
          <div>
            <label className="label">Tipo AFIP</label>
            <input className="input" type="number" value={tipo} onChange={e=>setTipo(Number(e.target.value))}/>
            <p className="text-xs text-gray-500 mt-1">Ej.: 11=Factura C, 6=Factura B, 1=Factura A</p>
          </div>
          <div>
            <label className="label">Últimos N</label>
            <input className="input" type="number" value={limite} onChange={e=>setLimite(Number(e.target.value))}/>
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={fetchData}>Buscar</button>
          </div>
        </div>
      </div>

      {loading && <Loader/>}
      {error && <ErrorBox error={error}/>}
      {!loading && !error && <ComprobantesTable data={data}/>}
    </div>
  )
}
