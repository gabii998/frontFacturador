import SubHeaderItemProps from "../props/SubHeaderItemProps";

const SubHeaderItem = (props:SubHeaderItemProps) => {
  return(
    <div className="card border border-slate-200 bg-white/95 shadow-sm px-2.5 py-1.5 flex flex-col gap-1 flex-1 min-w-[calc(50%-0.5rem)] text-center sm:text-left sm:min-w-[160px]">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-slate-400">{props.title}</span>
      <p className="text-[0.95rem] font-semibold text-slate-800 leading-tight">{props.content}</p>
    </div>
  )
}
export default SubHeaderItem;
