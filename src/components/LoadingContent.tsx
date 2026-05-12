const LoadingContent = () => {
  return (
    <div className="card flex flex-col items-center gap-5 bg-orange-50 py-12 text-slate-600">
      <LoadingIllustration />
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold text-slate-900">Cargando información</h2>
        <p className="text-sm leading-relaxed text-slate-600">
          Estamos preparando los datos solicitados.
        </p>
      </div>
    </div>
  )
}

const LoadingIllustration = () => {
  return (
    <svg
      className="loading-illustration"
      viewBox="0 0 160 160"
      fill="none"
      role="img"
      aria-label="Cargando"
    >
      <circle className="loading-illustration__orbit" cx="80" cy="80" r="68" stroke="#FDBA74" strokeWidth="4" strokeDasharray="16 18" />
      <circle className="loading-illustration__dot" cx="80" cy="12" r="6" fill="#F97316" />
      <rect x="45" y="34" width="70" height="92" rx="10" fill="#FFFFFF" stroke="#FDBA74" strokeWidth="4" />
      <path d="M96 34v20c0 5 4 9 9 9h10" fill="#FFEDD5" />
      <path d="M96 34v20c0 5 4 9 9 9h10" stroke="#FDBA74" strokeWidth="4" strokeLinejoin="round" />
      <rect className="loading-illustration__line loading-illustration__line--one" x="59" y="76" width="42" height="6" rx="3" fill="#F97316" />
      <rect className="loading-illustration__line loading-illustration__line--two" x="59" y="91" width="32" height="6" rx="3" fill="#FDBA74" />
      <rect className="loading-illustration__line loading-illustration__line--three" x="59" y="106" width="46" height="6" rx="3" fill="#FED7AA" />
    </svg>
  )
}

export default LoadingContent;
