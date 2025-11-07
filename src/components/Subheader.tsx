import SubHeaderItemProps from "../props/SubHeaderItemProps"
import SubHeaderItem from "./SubHeaderItem"

const Subheader = ({props, collapsed = false}: {props:SubHeaderItemProps[], collapsed?: boolean}) => {
  const stateClasses = collapsed
    ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none md:max-h-none md:opacity-100 md:translate-y-0 md:pointer-events-auto'
    : 'max-h-[800px] opacity-100 translate-y-0 pointer-events-auto'

  return (
    <div
      className={`w-full overflow-hidden md:overflow-visible transition-all duration-300 ease-out ${stateClasses}`}
      aria-hidden={collapsed ? true : undefined}
    >
      <div className="flex flex-wrap gap-2 w-full">
        {props.map((value, index) => (
          <SubHeaderItem
            key={index}
            title={value.title}
            content={value.content}
          />
        ))}
      </div>
    </div>
  )
}

export default Subheader;
