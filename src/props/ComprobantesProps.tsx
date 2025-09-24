import { ComprobanteEmitido } from "../models/afip";

export interface Stats {
    total: number;
    uniquePV: number;
    withCae: number;
    totalAmount: number;
    latest: ComprobanteEmitido | undefined;
}

export interface ComprobanteHeaderInfoProps {
    filtersOpen:boolean;
    setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface FiltrosProps {
    loading:boolean;
    setPv:React.Dispatch<React.SetStateAction<number>>;
    setTipo:React.Dispatch<React.SetStateAction<number>>;
    setLimite:React.Dispatch<React.SetStateAction<number>>;
    fetchData:(nextPv?: number, nextTipo?: number, nextLimite?: number) => Promise<void>;
    pv:number;
    tipo:number;
    limite:number;
}