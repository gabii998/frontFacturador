const EmptyPuntoVentaIcon = () => {
    return(
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
    )
}

export default EmptyPuntoVentaIcon;