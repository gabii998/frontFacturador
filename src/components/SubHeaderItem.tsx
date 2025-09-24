import SubHeaderItemProps from "../props/SubHeaderItemProps";

const SubHeaderItem = (props:SubHeaderItemProps) => {
    return(<div className="card border border-slate-200 bg-white/95 shadow-sm py-2 flex flex-col w-fit">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{props.title}</span>
            <p className="text-base font-semibold text-slate-800">{props.content}</p>
          </div>)
}
export default SubHeaderItem;