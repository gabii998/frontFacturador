import { ComprobanteEmitido } from "../models/afip";

export interface Stats {
    total: number;
    uniquePV: number;
    withCae: number;
    totalAmount: number;
    latest: ComprobanteEmitido | undefined;
}

export interface ComprobanteHeaderInfoProps {
    lastFetchLabel:string | null;
    filtersOpen:boolean;
    setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
}