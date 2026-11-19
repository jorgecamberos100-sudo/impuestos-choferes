// ============================================================
// ÚNICA fuente de tasas de la aplicación.
// Ningún componente debe hardcodear tasas: todo se importa de aquí.
// ============================================================

export const VIGENCIA = '2026-01-01';
export const VIGENCIA_TEXTO = '1 de enero de 2026';

export const LEYENDA_ESTIMACION =
  'Estimación educativa con las reglas vigentes al 1 de enero de 2026. No es asesoría fiscal; confirma con un contador.';

// --- IVA ---
export const IVA_GENERAL = 0.16;

// --- Retenciones de ISR (art. 113-A LISR) ---
// Transporte terrestre de pasajeros y entrega de bienes: 2.1 %
export const ISR_RETENCION_TRANSPORTE = 0.021;
// Solo como referencia; la calculadora usa transporte (2.1 %)
export const ISR_RETENCION_BIENES = 0.025;
export const ISR_RETENCION_HOSPEDAJE = 0.04;

// --- Retenciones de IVA ---
export const IVA_RETENIDO_CON_RFC = 0.08;
export const ISR_SIN_RFC = 0.20;
export const IVA_SIN_RFC = 0.16;

// --- Umbral del esquema definitivo anual ---
export const UMBRAL_DEFINITIVO_ANUAL = 300_000; // MXN / año

// --- Plataformas (todas con ISR 2.1 % en transporte/entrega) ---
export const PLATAFORMAS = [
  'Uber',
  'DiDi',
  'inDrive',
  'Rappi',
  'Uber Eats',
  'DiDi Food',
] as const;

export type Plataforma = (typeof PLATAFORMAS)[number];

// --- Tarifa del ISR mensual 2026 ---
// Art. 96 LISR, Anexo 8 RMF 2026 (DOF 28-dic-2025).
// 11 tramos; el último tiene límite superior Infinity.
// NO se aplica subsidio al empleo: es solo para sueldos,
// no para ingresos por plataformas digitales.
export interface TramoISR {
  limiteInferior: number;
  limiteSuperior: number;
  cuotaFija: number;
  porcentaje: number;
}

export const TARIFA_ISR_MENSUAL_2026: TramoISR[] = [
  { limiteInferior: 0.01, limiteSuperior: 844.59, cuotaFija: 0.0, porcentaje: 0.0192 },
  { limiteInferior: 844.6, limiteSuperior: 7_168.51, cuotaFija: 16.22, porcentaje: 0.064 },
  { limiteInferior: 7_168.52, limiteSuperior: 12_598.02, cuotaFija: 420.95, porcentaje: 0.1088 },
  { limiteInferior: 12_598.03, limiteSuperior: 14_644.64, cuotaFija: 1_011.68, porcentaje: 0.16 },
  { limiteInferior: 14_644.65, limiteSuperior: 17_533.64, cuotaFija: 1_339.14, porcentaje: 0.1792 },
  { limiteInferior: 17_533.65, limiteSuperior: 35_362.83, cuotaFija: 1_856.84, porcentaje: 0.2136 },
  { limiteInferior: 35_362.84, limiteSuperior: 55_736.68, cuotaFija: 5_665.16, porcentaje: 0.2352 },
  { limiteInferior: 55_736.69, limiteSuperior: 106_410.5, cuotaFija: 10_457.09, porcentaje: 0.3 },
  { limiteInferior: 106_410.51, limiteSuperior: 141_880.66, cuotaFija: 25_659.23, porcentaje: 0.32 },
  { limiteInferior: 141_880.67, limiteSuperior: 425_641.99, cuotaFija: 37_009.69, porcentaje: 0.34 },
  { limiteInferior: 425_642.0, limiteSuperior: Infinity, cuotaFija: 133_488.54, porcentaje: 0.35 },
];
