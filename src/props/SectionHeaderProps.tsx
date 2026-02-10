import { ReactNode } from "react";

export interface SectionHeaderProps {
    title:string;
    subtitle:string;
    icon:ReactNode;
    rightContent?:ReactNode,
    bottomContent?:ReactNode | ((collapsed: boolean) => ReactNode);
    collapsible?: boolean;
}

export default SectionHeaderProps;
