import HeaderPillProps from "../props/HeaderPillProps"

const HeaderPill = (props: HeaderPillProps) => {
    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 font-medium shadow-sm">
            <span className={`h-2 w-2 rounded-full ${props.dotColor}`} aria-hidden />
            {props.label}
        </span>
    )
}

export default HeaderPill;