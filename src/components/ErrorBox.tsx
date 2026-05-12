import { ApiError } from '../services/api'

export default function ErrorBox({ error }: { error?: unknown }) {
  if (!error) return null

  let message: string

  if (error instanceof ApiError) {
    const suffix = error.message?.trim() || 'Error desconocido'
    message = `${error.status} ${suffix}`
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = String(error)
  }

  return (<div className="card flex flex-col items-center gap-5 bg-red-50 py-12 text-red-700">
    <ErrorIllustration />
    <div className="space-y-2 text-center">
      <h2 className="text-lg font-semibold text-slate-900">No pudimos completar la operación</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-600">
        {message}
      </p>
    </div>
  </div>)
}

const ErrorIllustration = () => {
  return (
    <svg
      className="h-32 w-32"
      viewBox="0 0 160 160"
      fill="none"
      role="img"
      aria-label="Error"
    >
      <rect x="29" y="25" width="88" height="110" rx="10" fill="#FFFFFF" />
      <rect x="29" y="25" width="88" height="110" rx="10" stroke="#FCA5A5" strokeWidth="4" />
      <path d="M96 25v27c0 6.1 4.9 11 11 11h10" fill="#FEE2E2" />
      <path d="M96 25v27c0 6.1 4.9 11 11 11h10" stroke="#FCA5A5" strokeWidth="4" strokeLinejoin="round" />
      <rect x="45" y="76" width="56" height="6" rx="3" fill="#FECACA" />
      <rect x="45" y="91" width="42" height="6" rx="3" fill="#FECACA" />
      <rect x="45" y="106" width="50" height="6" rx="3" fill="#FECACA" />
      <circle cx="111" cy="111" r="24" fill="#DC2626" />
      <path d="M111 97v18" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
      <circle cx="111" cy="124" r="3.5" fill="#FFFFFF" />
    </svg>
  )
}
