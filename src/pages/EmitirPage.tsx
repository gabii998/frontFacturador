import EmitirForm from '../components/EmitirForm'
import Loader from '../components/Loader'
import ErrorBox from '../components/ErrorBox'
import { useOnboarding } from '../contexts/OnboardingContext'
import OnboardingReminder from '../components/OnboardingReminder'

export default function EmitirPage() {
  const { status: onboarding, loading, error } = useOnboarding()

  if (loading) return <Loader />
  if (error) return <ErrorBox error={error} />
  if (!onboarding?.configured) return <OnboardingReminder feature="la emisión de comprobantes" />

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Emitir comprobante</h1>
      <EmitirForm />
    </div>
  )
}
