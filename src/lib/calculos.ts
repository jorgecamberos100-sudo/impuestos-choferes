import {
  IVA_GENERAL,
  ISR_RETENCION_TRANSPORTE,
  ISR_SIN_RFC,
  IVA_RETENIDO_CON_RFC,
  IVA_SIN_RFC,
  UMBRAL_DEFINITIVO_ANUAL,
  TARIFA_ISR_MENSUAL_2026,
} from './tasas';

/**
 * Redondeo half-up a 2 decimales.
 * Se usa en cada importe calculado.
 */
function redondear(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Quita el IVA general (16 %) de un ingreso expresado con IVA.
 */
export function baseSinIVA(ingresoConIVA: number): number {
  return redondear(ingresoConIVA / (1 + IVA_GENERAL));
}

export interface ResultadoRetenciones {
  base: number;
  isr: number;
  iva: number;
  deposito: number;
  tasaISR: number;
  tasaIVA: number;
}

/**
 * Calcula las retenciones de ISR e IVA que aplica la plataforma,
 * y el depósito neto estimado.
 *
 * Con RFC: ISR 2.1 %, IVA 8 %.
 * Sin RFC: ISR 20 %, IVA 16 %.
 */
export function calcularRetenciones(args: {
  ingresoConIVA: number;
  conRFC: boolean;
}): ResultadoRetenciones {
  const { ingresoConIVA, conRFC } = args;
  const base = baseSinIVA(ingresoConIVA);

  const tasaISR = conRFC ? ISR_RETENCION_TRANSPORTE : ISR_SIN_RFC;
  const tasaIVA = conRFC ? IVA_RETENIDO_CON_RFC : IVA_SIN_RFC;

  const isr = redondear(base * tasaISR);
  const iva = redondear(base * tasaIVA);
  const deposito = redondear(ingresoConIVA - isr - iva);

  return { base, isr, iva, deposito, tasaISR, tasaIVA };
}

/**
 * Calcula el ISR causado según la tarifa mensual del art. 96 LISR
 * (Anexo 8 RMF 2026), dado un ingreso base gravable.
 *
 * Si baseGravable <= 0, devuelve 0.
 */
export function isrSegunTarifa(baseGravable: number): number {
  if (baseGravable <= 0) return 0;

  for (const tramo of TARIFA_ISR_MENSUAL_2026) {
    const dentro =
      baseGravable >= tramo.limiteInferior &&
      (tramo.limiteSuperior === Infinity || baseGravable <= tramo.limiteSuperior);

    if (dentro) {
      const excedente = baseGravable - tramo.limiteInferior;
      return redondear(tramo.cuotaFija + excedente * tramo.porcentaje);
    }
  }

  return 0;
}

export interface ResultadoDefinitivo {
  isrRetenido: number;
  ivaRetenido: number;
  total: number;
}

export interface ResultadoProvisional {
  baseGravable: number;
  isrCausado: number;
  isrPorPagar: number;
  ivaTrasladado: number;
  ivaAcreditable: number;
  ivaRetenido: number;
  ivaPorPagar: number;
  totalPorPagar: number;
}

export interface ResultadoComparacion {
  definitivoDisponible: boolean;
  definitivo: ResultadoDefinitivo;
  provisional: ResultadoProvisional;
  diferencia: number;
  recomendacion: 'definitivo' | 'provisional' | 'no-disponible';
}

/**
 * Compara el esquema definitivo (retenciones como impuesto final)
 * contra el esquema provisional (ISR causado sobre base gravable
 * con deducción de gasolina y acreditamiento de IVA).
 *
 * Simplificación educativa: el pago provisional real se calcula
 * sobre el ingreso acumulado del año; esta calculadora estima
 * el mes aislado.
 */
export function compararEsquemas(args: {
  ingresoConIVA: number;
  gasolinaConIVA: number;
  gasolinaConCFDI: boolean;
}): ResultadoComparacion {
  const { ingresoConIVA, gasolinaConIVA, gasolinaConCFDI } = args;

  const base = baseSinIVA(ingresoConIVA);
  const retenciones = calcularRetenciones({ ingresoConIVA, conRFC: true });

  // --- Esquema definitivo ---
  const definitivoDisponible = ingresoConIVA * 12 <= UMBRAL_DEFINITIVO_ANUAL;

  const isrRetenido = retenciones.isr;
  const ivaRetenido = retenciones.iva;
  const totalDefinitivo = redondear(isrRetenido + ivaRetenido);

  const definitivo: ResultadoDefinitivo = {
    isrRetenido,
    ivaRetenido,
    total: totalDefinitivo,
  };

  // --- Esquema provisional ---
  // Deducción de gasolina solo si hay CFDI.
  let gasolinaBase = 0;
  let ivaAcreditable = 0;

  if (gasolinaConCFDI) {
    gasolinaBase = redondear(gasolinaConIVA / (1 + IVA_GENERAL));
    ivaAcreditable = redondear(gasolinaBase * IVA_GENERAL);
  }

  const baseGravable = redondear(Math.max(0, base - gasolinaBase));

  const isrCausado = isrSegunTarifa(baseGravable);
  const isrPorPagar = redondear(Math.max(0, isrCausado - isrRetenido));

  const ivaTrasladado = redondear(base * IVA_GENERAL);
  // Puede ser negativo = saldo a favor; se muestra tal cual.
  const ivaPorPagar = redondear(ivaTrasladado - ivaAcreditable - ivaRetenido);

  const totalPorPagar = redondear(isrPorPagar + ivaPorPagar);

  const provisional: ResultadoProvisional = {
    baseGravable,
    isrCausado,
    isrPorPagar,
    ivaTrasladado,
    ivaAcreditable,
    ivaRetenido,
    ivaPorPagar,
    totalPorPagar,
  };

  // --- Comparación ---
  const diferencia = redondear(totalDefinitivo - totalPorPagar);

  let recomendacion: ResultadoComparacion['recomendacion'];

  if (!definitivoDisponible) {
    recomendacion = 'no-disponible';
  } else if (diferencia > 0) {
    recomendacion = 'provisional';
  } else {
    recomendacion = 'definitivo';
  }

  return {
    definitivoDisponible,
    definitivo,
    provisional,
    diferencia,
    recomendacion,
  };
}
