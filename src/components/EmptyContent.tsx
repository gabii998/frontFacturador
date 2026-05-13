import EmptyContentProps from "../props/EmptyContentProps";

function EmptyStateIllustration() {
    return (
        <svg className="empty-state__illustration" viewBox="0 0 220 150" aria-hidden="true">
            <rect x="56" y="28" width="108" height="88" rx="12" fill="#fff" stroke="#CBD5E1" strokeWidth="3" />
            <path d="M136 28 L164 56 L142 56 C139 56 136 53 136 50 Z" fill="#FFE8D5" stroke="#FDBA74" strokeWidth="3" />
            <rect x="78" y="54" width="50" height="7" rx="3.5" fill="#F97316" />
            <rect x="78" y="75" width="84" height="6" rx="3" fill="#CBD5E1" />
            <rect x="78" y="92" width="58" height="6" rx="3" fill="#E2E8F0" />
            <rect x="72" y="126" width="90" height="8" rx="4" fill="#E2E8F0" />
            <circle cx="61" cy="38" r="9" fill="#FDBA74" opacity="0.35" />
            <circle cx="170" cy="102" r="13" fill="#F97316" opacity="0.16" />
            <g className="empty-state__magnifier">
                <circle cx="149" cy="96" r="24" fill="#FFF7ED" stroke="#F97316" strokeWidth="5" />
                <path d="M166 113 L184 131" stroke="#F97316" strokeWidth="7" strokeLinecap="round" />
                <path d="M138 96 H160" stroke="#FDBA74" strokeWidth="5" strokeLinecap="round" />
            </g>
        </svg>
    )
}

const EmptyContent = (props: EmptyContentProps) => {
    return (<div className="empty-state">
        <EmptyStateIllustration />
        <div className="empty-state__content">
            <h2>{props.title}</h2>
            <p>
                {props.subtitle}
            </p>
        </div>
    </div>)
}

export default EmptyContent;
