import { IconChevronDown } from "@tabler/icons-react"
import { useState } from "react"
import SectionHeaderProps from "../props/SectionHeaderProps"

const SectionHeader = (props:SectionHeaderProps) => {
  const [mobileCollapsed, setMobileCollapsed] = useState(true)
  const enableCollapse = Boolean(props.collapsible && props.bottomContent)
  const effectiveCollapsed = enableCollapse ? mobileCollapsed : false
  const bottomContent = typeof props.bottomContent === 'function'
    ? props.bottomContent(effectiveCollapsed)
    : props.bottomContent

  return(
    <section className="card bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-500/20 text-blue-600">
                <div className="flex h-6 w-6 items-center justify-center">{props.icon}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="auth-eyebrow">{props.section}</span>
                {enableCollapse && (
                  <button
                    type="button"
                    aria-label={effectiveCollapsed ? 'Mostrar métricas' : 'Ocultar métricas'}
                    aria-expanded={!effectiveCollapsed}
                    className="md:hidden inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 text-blue-600 bg-white"
                    onClick={() => setMobileCollapsed(prev => !prev)}
                  >
                    <IconChevronDown className={`h-4 w-4 transition-transform ${effectiveCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">{props.title}</h1>
            <p className="text-sm text-slate-600">
              {props.subtitle}
            </p>
          </div>
        </div>
        {props.rightContent && (
          <div className="flex flex-wrap gap-2 text-sm text-blue-700 md:justify-end">
            {props.rightContent}
          </div>
        )}
      </div>
      {bottomContent && (
        <div className="mt-4">
          {bottomContent}
        </div>
      )}
    </section>
  )
}

export default SectionHeader;
