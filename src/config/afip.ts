// Fuente: AFIP - "Datos de los comprobantes" (RG 1415/2003 Anexo II). Actualiza el tope cuando cambie la normativa.
const DEFAULT_CF_ID_THRESHOLD = 10_000_000

const rawThreshold = import.meta.env.VITE_AFIP_CF_ID_THRESHOLD
const parsedThreshold = rawThreshold === undefined ? Number.NaN : Number(rawThreshold)

export const CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD = Number.isFinite(parsedThreshold) && parsedThreshold > 0
  ? parsedThreshold
  : DEFAULT_CF_ID_THRESHOLD

export const AFIP_CONFIG = {
  consumerFinalIdentificationThreshold: CONSUMIDOR_FINAL_IDENTIFICATION_THRESHOLD
}
