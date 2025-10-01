import { Concepto, CondicionImpositiva, DocumentoTipo, FacturaItem, PuntoVenta } from "../models/afip";

export interface PrimerPasoProps {
    puntosVenta: PuntoVenta[];
    pv: number;
    setPv: React.Dispatch<React.SetStateAction<number>>;
    puntosVentaError: string | null;
    concepto: Concepto;
    setConcepto:React.Dispatch<React.SetStateAction<Concepto>>,
    requiresServicePeriod:boolean,
    servicioDesde:string;
    setServicioDesde:React.Dispatch<React.SetStateAction<string>>,
    servicioHasta:string;
    setServicioHasta:React.Dispatch<React.SetStateAction<string>>,
    vencimientoPago:string;
    setVencimientoPago:React.Dispatch<React.SetStateAction<string>>,
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

export interface TercerPasoProps {
    items:FacturaItem[];
    setItems:React.Dispatch<React.SetStateAction<FacturaItem[]>>;
    totalAmount:number;
}

export interface FooterProps {
    loading:boolean;
    currentStep:StepEmitir;
    volverAtras:() => void;
}

export enum StepEmitir {
    CONFIGURACION,//primer paso
    DATOS_RECEPTOR,//segundo paso
    ITEMS,//tercer paso
    RESULTADO//cuarto y ultimo paso
}
