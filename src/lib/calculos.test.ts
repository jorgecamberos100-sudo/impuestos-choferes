import { describe, expect, it } from 'vitest';
import { baseSinIVA, calcularRetenciones, compararEsquemas, isrSegunTarifa } from './calculos';

describe('baseSinIVA (caso 8: redondeo a centavos)', () => {
  it('$15,000 con IVA → base $12,931.03', () => {
    expect(baseSinIVA(15000)).toBeCloseTo(12931.03, 1);
  });

  it('$100 con IVA → base $86.21', () => {
    expect(baseSinIVA(100)).toBeCloseTo(86.21, 1);
  });

  it('$0 → base $0', () => {
    expect(baseSinIVA(0)).toBe(0);
  });
});

describe('calcularRetenciones', () => {
  it('caso 1: con RFC y $15,000 con IVA → base 12,931.03, ISR 271.55, IVA 1,034.48, depósito 13,693.97', () => {
    const r = calcularRetenciones({ ingresoConIVA: 15000, conRFC: true });
    expect(r.base).toBeCloseTo(12931.03, 1);
    expect(r.isr).toBeCloseTo(271.55, 1);
    expect(r.iva).toBeCloseTo(1034.48, 1);
    expect(r.deposito).toBeCloseTo(13693.97, 1);
    expect(r.tasaISR).toBeCloseTo(0.021, 5);
    expect(r.tasaIVA).toBeCloseTo(0.08, 5);
  });

  it('caso 2: sin RFC y $15,000 con IVA → ISR 2,586.21 (20%), IVA 2,068.97 (16%), depósito 10,344.83', () => {
    const r = calcularRetenciones({ ingresoConIVA: 15000, conRFC: false });
    expect(r.isr).toBeCloseTo(2586.21, 1);
    expect(r.iva).toBeCloseTo(2068.97, 1);
    expect(r.deposito).toBeCloseTo(10344.83, 1);
    expect(r.tasaISR).toBeCloseTo(0.2, 5);
    expect(r.tasaIVA).toBeCloseTo(0.16, 5);
  });

  it('caso 3: con RFC y $8,000 con IVA → base 6,896.55, ISR 144.83, IVA 551.72, depósito 7,303.45', () => {
    const r = calcularRetenciones({ ingresoConIVA: 8000, conRFC: true });
    expect(r.base).toBeCloseTo(6896.55, 1);
    expect(r.isr).toBeCloseTo(144.83, 1);
    expect(r.iva).toBeCloseTo(551.72, 1);
    expect(r.deposito).toBeCloseTo(7303.45, 1);
  });

  it('depósito + ISR + IVA reconstruyen el ingreso bruto', () => {
    const r = calcularRetenciones({ ingresoConIVA: 15000, conRFC: true });
    expect(r.deposito + r.isr + r.iva).toBeCloseTo(15000, 1);
  });

  it('ingreso $0 → todo en ceros', () => {
    const r = calcularRetenciones({ ingresoConIVA: 0, conRFC: true });
    expect(r.base).toBe(0);
    expect(r.isr).toBe(0);
    expect(r.iva).toBe(0);
    expect(r.deposito).toBe(0);
  });
});

describe('isrSegunTarifa (caso 7: tarifa mensual 2026, art. 96 LISR)', () => {
  it('base 9,482.76 → ISR 672.74', () => {
    expect(isrSegunTarifa(9482.76)).toBeCloseTo(672.74, 1);
  });

  it('base 12,931.03 → ISR 1,064.96', () => {
    expect(isrSegunTarifa(12931.03)).toBeCloseTo(1064.96, 1);
  });

  it('base 20,000 → ISR 2,383.65', () => {
    expect(isrSegunTarifa(20000)).toBeCloseTo(2383.65, 1);
  });

  it('base 0 → ISR 0', () => {
    expect(isrSegunTarifa(0)).toBe(0);
  });
});

describe('compararEsquemas', () => {
  it('caso 4: $15,000 + gasolina $4,000 con CFDI → el provisional ahorra 422.08', () => {
    const r = compararEsquemas({
      ingresoConIVA: 15000,
      gasolinaConIVA: 4000,
      gasolinaConCFDI: true,
    });

    expect(r.definitivoDisponible).toBe(true);

    expect(r.definitivo.isrRetenido).toBeCloseTo(271.55, 1);
    expect(r.definitivo.ivaRetenido).toBeCloseTo(1034.48, 1);
    expect(r.definitivo.total).toBeCloseTo(1306.03, 1);

    expect(r.provisional.baseGravable).toBeCloseTo(9482.76, 1);
    expect(r.provisional.isrCausado).toBeCloseTo(672.74, 1);
    expect(r.provisional.isrPorPagar).toBeCloseTo(401.19, 1);
    expect(r.provisional.ivaTrasladado).toBeCloseTo(2068.97, 1);
    expect(r.provisional.ivaAcreditable).toBeCloseTo(551.72, 1);
    expect(r.provisional.ivaRetenido).toBeCloseTo(1034.48, 1);
    expect(r.provisional.ivaPorPagar).toBeCloseTo(482.76, 1);
    expect(r.provisional.totalPorPagar).toBeCloseTo(883.95, 1);

    expect(r.diferencia).toBeCloseTo(422.08, 1);
    expect(r.diferencia).toBeGreaterThan(0);
    expect(r.recomendacion).toBe('provisional');
  });

  it('caso 5: $15,000 sin gasolina → el definitivo gana por 521.86 (diferencia NEGATIVA)', () => {
    const r = compararEsquemas({
      ingresoConIVA: 15000,
      gasolinaConIVA: 0,
      gasolinaConCFDI: false,
    });
    expect(r.definitivo.total).toBeCloseTo(1306.03, 1);
    expect(r.provisional.isrPorPagar).toBeCloseTo(793.41, 1);
    expect(r.provisional.ivaPorPagar).toBeCloseTo(1034.48, 1);
    expect(r.provisional.totalPorPagar).toBeCloseTo(1827.89, 1);

    expect(r.diferencia).toBeCloseTo(-521.86, 1);
    expect(r.diferencia).toBeLessThan(0);
    expect(r.recomendacion).toBe('definitivo');

  });

  it('caso 6: $30,000/mes → anualizado $360,000 → definitivo no disponible', () => {
    const r = compararEsquemas({
      ingresoConIVA: 30000,
      gasolinaConIVA: 4000,
      gasolinaConCFDI: true,
    });
    expect(r.definitivoDisponible).toBe(false);
    expect(r.recomendacion).toBe('no-disponible');
  });

  it('caso 6: $15,000/mes → anualizado $180,000 → definitivo disponible', () => {
    const r = compararEsquemas({
      ingresoConIVA: 15000,
      gasolinaConIVA: 0,
      gasolinaConCFDI: false,
    });
    expect(r.definitivoDisponible).toBe(true);
  });

  it('sin CFDI la gasolina no se deduce ni acredita IVA', () => {
    const r = compararEsquemas({
      ingresoConIVA: 15000,
      gasolinaConIVA: 4000,
      gasolinaConCFDI: false,
    });
    expect(r.provisional.ivaAcreditable).toBe(0);
    expect(r.provisional.baseGravable).toBeCloseTo(12931.03, 1);
    expect(r.provisional.totalPorPagar).toBeCloseTo(1827.89, 1);
  });

  it('gasolina alta con CFDI genera saldo a favor de IVA (IVA por pagar negativo)', () => {
    const r = compararEsquemas({
      ingresoConIVA: 15000,
      gasolinaConIVA: 12000,
      gasolinaConCFDI: true,
    });
    expect(r.provisional.ivaPorPagar).toBeCloseTo(-620.69, 1);
    expect(r.provisional.ivaPorPagar).toBeLessThan(0);
  });
});