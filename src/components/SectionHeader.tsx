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
    <section className="card border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
            <div className="flex h-5 w-5 items-center justify-center">{props.icon}</div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
      
              {enableCollapse && (
                <button
                  type="button"
                  aria-label={effectiveCollapsed ? 'Mostrar métricas' : 'Ocultar métricas'}
                  aria-expanded={!effectiveCollapsed}
                  className="md:hidden inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                  onClick={() => setMobileCollapsed(prev => !prev)}
                >
                  <IconChevronDown className={`h-4 w-4 transition-transform ${effectiveCollapsed ? '' : 'rotate-180'}`} />
                </button>
              )}
            </div>
            <h1 className="text-xl font-semibold text-slate-900">{props.title}</h1>
            <p className="text-sm text-slate-500">{props.subtitle}</p>
          </div>
        </div>
        {props.rightContent && (
          <div className="flex flex-wrap gap-2 text-sm text-slate-600 md:justify-end">
            {props.rightContent}
          </div>
        )}
      </div>
      {bottomContent && <div className="mt-3">{bottomContent}</div>}
    </section>
  )
}

export default SectionHeader;
