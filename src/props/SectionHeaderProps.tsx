import { ReactNode } from "react";

export interface SectionHeaderProps {
    section:string;
    title:string;
    subtitle:string;
    icon:ReactNode;
    rightContent:ReactNode
}

export default SectionHeaderProps;