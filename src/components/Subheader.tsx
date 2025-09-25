import SubHeaderItemProps from "../props/SubHeaderItemProps"
import SubHeaderItem from "./SubHeaderItem"

const Subheader = ({props}: {props:SubHeaderItemProps[]}) => {
    return (<div>
        {props.map((value, index) => {
            return (<SubHeaderItem
                key={index}
                title={value.title}
                content={value.content}
            />)
        })}
    </div>)
}

export default Subheader;