export interface Totals {
  total: number;
  activos: number;
  bloqueados: number;
  dadosDeBaja: number;
}

export interface PuntoVentaHeaderInfoProps {
  totals: Totals;
  lastSyncLabel: string;
}