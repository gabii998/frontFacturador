import SectionHeader from '../components/SectionHeader'
import HeaderPill from '../components/HeaderPill'
import PlanesIcon from '../icon/PlanesIcon'
import { PLAN_COLORS, PLAN_DETAILS, PlanName } from '../constants/planes'

const PlanesPage = () => {
  const planActual: PlanName = 'Gratuito'

  return (
    <div className="space-y-6">
      <SectionHeader
        section="Planes"
        icon={<PlanesIcon />}
        title="Compará y elegí el plan ideal"
        subtitle="Encontrá la opción que mejor se adapta a tu negocio y escalá tu facturación sin obstáculos."
        rightContent={
          <HeaderPill
            label={`Plan actual: ${planActual}`}
            dotColor={PLAN_COLORS[planActual]}
          />
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_DETAILS.map((plan) => {
          const esActual = plan.name === planActual

          return (
            <article
              key={plan.name}
              className={`card flex h-full flex-col gap-5 border ${
                plan.highlighted
                  ? 'border-blue-200 shadow-lg shadow-blue-500/20'
                  : 'border-slate-200 shadow-slate-900/5'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Plan</span>
                  <h2 className="text-2xl font-semibold text-slate-900">{plan.name}</h2>
                  <p className="text-sm text-slate-600">{plan.headline}</p>
                </div>
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase text-white ${PLAN_COLORS[plan.name]}`}
                >
                  {plan.name.charAt(0)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-semibold text-slate-900">{plan.price}</div>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-3">
                <button
                  type="button"
                  className={`${
                    esActual
                      ? 'btn w-full cursor-default bg-slate-100 text-slate-500'
                      : plan.highlighted
                      ? 'btn-primary w-full'
                      : 'btn w-full'
                  }`}
                  disabled={esActual}
                >
                  {esActual ? 'Plan activo' : 'Elegir este plan'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default PlanesPage
