import SectionHeaderProps from "../props/SectionHeaderProps"

const SectionHeader = (props:SectionHeaderProps) => {
    return(
        <section className="card bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex items-center justify-between gap-6">
          <div className="flex w-1/2 items-start gap-4">
            <div className="flex h-14 w-[150px] items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-500/20 text-blue-600">
              <div className="w-[40px] h-[30px] items-center justify-center flex">{props.icon}</div>
            </div>
            <div className="w-screen space-y-2">
              <span className="auth-eyebrow">{props.section}</span>
              <h1 className="text-2xl font-semibold text-slate-900">{props.title}</h1>
              <p className="text-sm text-slate-600">
                {props.subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-blue-700">
            {props.rightContent}
          </div>
        </div>
        <div className="mt-3 subheader">
          {props.bottomContent}
        </div>
      </section>
    )
}

export default SectionHeader;