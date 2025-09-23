import SubHeaderItemProps from "../props/SubHeaderItemProps";

const SubHeaderItem = (props:SubHeaderItemProps) => {
    return(<div className="card border border-slate-200 bg-white/95 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{props.title}</span>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{props.content}</p>
            <p className="mt-1 text-xs text-slate-500">{props.subtitle}</p>
          </div>)
}
export default SubHeaderItem;