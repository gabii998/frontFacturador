import { DashboardCardProps, DashboardService } from "../props/DashboardProps";

const DashboardHeaderPill = ({service}: {service:DashboardService}) => {
    return (
        <div className={`service-chip service-chip--${service.tone}`}>
            <span className="service-chip__dot" />
            <div>
                <span className="service-chip__label">{service.label}</span>
                <span className="service-chip__status">{service.status}</span>
            </div>
        </div>
    );
}

export default DashboardHeaderPill;