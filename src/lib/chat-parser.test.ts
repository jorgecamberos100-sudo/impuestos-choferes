import { describe, expect, it } from 'vitest';
import { extraerMonto, parsearMensaje } from './chat-parser';

describe('parsearMensaje', () => {
  it('detecta ingreso con monto en formato de moneda', () => {
    const r = parsearMensaje('Gané $15,000 este mes');
    expect(r.intencion).toBe('ingreso');
    expect(r.monto).toBeCloseTo(15000);
  });

  it('detecta gasolina sin signo de moneda', () => {
    const r = parsearMensaje('gasté 4000 de gasolina');
    expect(r.intencion).toBe('gasolina');
    expect(r.monto).toBeCloseTo(4000);
  });

  it('detecta gasolina con monto y comas', () => {
    const r = parsearMensaje('Gasté $3,500 en gasolina');
    expect(r.intencion).toBe('gasolina');
    expect(r.monto).toBeCloseTo(3500);
  });

  it('detecta pregunta de retenciones', () => {
    expect(parsearMensaje('¿Cuánto me retienen?').intencion).toBe('retenciones');
  });

  it('detecta pregunta de comparador', () => {
    expect(parsearMensaje('¿definitivo o provisional?').intencion).toBe('comparador');
  });

  it('detecta RFC negativo', () => {
    const r = parsearMensaje('no tengo RFC');
    expect(r.intencion).toBe('rfc');
    expect(r.conRFC).toBe(false);
  });

  it('detecta RFC positivo', () => {
    const r = parsearMensaje('tengo mi RFC registrado');
    expect(r.intencion).toBe('rfc');
    expect(r.conRFC).toBe(true);
  });

  it('cae en ayuda cuando no entiende', () => {
    expect(parsearMensaje('hola').intencion).toBe('ayuda');
  });

  it('entiende miles con la palabra mil', () => {
    const r = parsearMensaje('gané 15 mil');
    expect(r.intencion).toBe('ingreso');
    expect(r.monto).toBeCloseTo(15000);
  });

  it('ignora fechas al extraer el monto', () => {
    const r = parsearMensaje('Gané 15000 el 15 de noviembre de 2026');
    expect(r.intencion).toBe('ingreso');
    expect(r.monto).toBeCloseTo(15000);
  });

  it('detecta sin RFC', () => {
    const r = parsearMensaje('sin RFC');
    expect(r.intencion).toBe('rfc');
    expect(r.conRFC).toBe(false);
  });

  it('detecta me pagaron con decimales', () => {
    const r = parsearMensaje('me pagaron 12500.50');
    expect(r.intencion).toBe('ingreso');
    expect(r.monto).toBeCloseTo(12500.5);
  });

  it('detecta qué me conviene como comparador', () => {
    expect(parsearMensaje('¿qué me conviene?').intencion).toBe('comparador');
  });

  it('detecta cuánto me depositan como retenciones', () => {
    expect(parsearMensaje('¿cuánto me depositan?').intencion).toBe('retenciones');
  });

  it('anotar gasolina sin monto no inventa cantidad', () => {
    const r = parsearMensaje('anotar gasolina');
    expect(r.intencion).toBe('gasolina');
    expect(r.monto).toBeUndefined();
  });

  it('distingue la pregunta de registro de RFC', () => {
    expect(parsearMensaje('¿cómo registro mi RFC?').intencion).toBe('registroRFC');
  });

  it('detecta cobré con miles', () => {
    const r = parsearMensaje('cobré 8 mil este mes');
    expect(r.intencion).toBe('ingreso');
    expect(r.monto).toBeCloseTo(8000);
  });
});

describe('extraerMonto', () => {
  it('monto con signo y comas', () => {
    expect(extraerMonto('$15,000')).toBeCloseTo(15000);
  });

  it('monto simple', () => {
    expect(extraerMonto('15000')).toBeCloseTo(15000);
  });

  it('miles con la palabra mil', () => {
    expect(extraerMonto('15 mil')).toBeCloseTo(15000);
  });

  it('miles con k', () => {
    expect(extraerMonto('15k')).toBeCloseTo(15000);
  });

  it('decimales con punto', () => {
    expect(extraerMonto('1500.50')).toBeCloseTo(1500.5);
  });

  it('comas de miles sin signo', () => {
    expect(extraerMonto('3,500')).toBeCloseTo(3500);
  });

  it('signo con espacio y decimales', () => {
    expect(extraerMonto('$ 2,500.75')).toBeCloseTo(2500.75);
  });

  it('devuelve null sin números', () => {
    expect(extraerMonto('sin números aquí')).toBeNull();
  });

  it('devuelve null si solo hay una fecha', () => {
    expect(extraerMonto('15 de noviembre de 2026')).toBeNull();
  });

  it('ignora porcentajes', () => {
    expect(extraerMonto('me quitan el 36%')).toBeNull();
  });
});