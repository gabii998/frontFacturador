import { ReactNode } from "react";

export interface SectionHeaderProps {
    section:string;
    title:string;
    subtitle:string;
    icon:ReactNode;
    rightContent:ReactNode,
    bottomContent?:ReactNode;
}

export default SectionHeaderProps;