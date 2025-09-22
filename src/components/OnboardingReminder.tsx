import { Link } from 'react-router-dom'

interface OnboardingReminderProps {
  feature: string
}

export default function OnboardingReminder({ feature }: OnboardingReminderProps) {
  return (
    <div className="card border border-amber-200 bg-amber-50 text-amber-800">
      <h2 className="text-lg font-semibold">Configuración requerida</h2>
      <p className="text-sm mt-2">
        Para utilizar <b>{feature}</b> primero completá el onboarding cargando el certificado, la clave privada y el alias del WSAA.
      </p>
      <Link to="/configuracion" className="btn-primary mt-4 inline-flex w-fit">Ir a configuración</Link>
    </div>
  )
}
