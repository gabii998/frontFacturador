import { ReactElement } from "react";

export interface DashboardCardProps {
    icon: ReactElement;
    section: string,
    title: string;
    content: string;
    buttonLabel: string;
    buttonDestination: string;
}

export interface DashboardService {
    key: string;
    label: string;
    status: string;
    tone: string;
}