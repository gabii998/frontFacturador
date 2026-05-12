import { Link } from "react-router-dom";
import { DashboardCardProps } from "../props/DashboardProps";

const DashboardCard = (props: DashboardCardProps) => {
    return (
        <article className="metric-card">
            <header className="metric-card__header">
                <div className="metric-card__icon">
                    {props.icon}
                </div>
                <div>
                    <span className="metric-card__label">{props.section}</span>
                    <strong className="metric-card__value">{props.title}</strong>
                </div>
            </header>
            <p className="metric-card__description">{props.content}</p>
            <Link to={`/${props.buttonDestination}`} className="metric-card__cta">{props.buttonLabel}</Link>
        </article>
    )
}

export default DashboardCard;
