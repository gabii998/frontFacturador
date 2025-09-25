import { Concepto, CondicionImpositiva, DocumentoTipo, PuntoVenta } from "../models/afip";

export interface PrimerPasoProps {
    puntosVenta: PuntoVenta[];
    pv: number;
    setPv: React.Dispatch<React.SetStateAction<number>>;
    puntosVentaError: string | null;
    concepto: Concepto;
    setConcepto:React.Dispatch<React.SetStateAction<Concepto>>
}

export interface SegundoPasoProps {
    cond:CondicionImpositiva;
    setCond:React.Dispatch<React.SetStateAction<CondicionImpositiva>>;
    requiresCustomerIdentification:boolean;
    docTipo:DocumentoTipo;
    setDocTipo:React.Dispatch<React.SetStateAction<DocumentoTipo>>;
    docNro:string;
    setDocNro:React.Dispatch<React.SetStateAction<string>>;
}
