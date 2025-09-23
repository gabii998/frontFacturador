import { Link } from "react-router-dom";
import { DashboardCardProps } from "../props/DashboardProps";

const DashboardCard = (props: DashboardCardProps) => {
    return (
        <article className="metric-card">
            <div className="metric-card__icon metric-card__icon--blue">
                {props.icon}
            </div>
            <header className="metric-card__header">
                <span className="metric-card__label">{props.section}</span>
                <strong className="metric-card__value">{props.title}</strong>
            </header>
            <p className="metric-card__description">{props.content}</p>
            <Link to={`/${props.buttonDestination}`} className="metric-card__cta">{props.buttonLabel}</Link>
        </article>
    )
}

export default DashboardCard;