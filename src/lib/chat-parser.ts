// Reglas locales para entender mensajes de MiVolante. Sin IA externa.

export type Intencion =
  | 'ingreso'
  | 'gasolina'
  | 'retenciones'
  | 'comparador'
  | 'rfc'
  | 'registroRFC'
  | 'ayuda';

export interface ResultadoMensaje {
  intencion: Intencion;
  monto?: number;
  conRFC?: boolean;
}

const MESES =
  'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function quitarFechas(t: string): string {
  return t
    .replace(
      new RegExp(
        `\\b\\d{1,2}\\s+de\\s+(?:${MESES})(?:\\s+(?:de\\s+|del\\s+)?(?:19|20)\\d{2})?`,
        'g',
      ),
      ' ',
    )
    .replace(
      new RegExp(`\\b(?:${MESES})\\s+(?:de\\s+|del\\s+)?(?:19|20)\\d{2}\\b`, 'g'),
      ' ',
    )
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')
    .replace(/\b(?:en|de|del|ano)\s+(?:19|20)\d{2}\b/g, ' ');
}

function interpretarNumero(bruto: string): number {
  let s = bruto;
  const coma = s.lastIndexOf(',');
  const punto = s.lastIndexOf('.');
  if (coma >= 0 && punto >= 0) {
    s = coma > punto ? s.replace(/\./g, '').replace(/,/g, '.') : s.replace(/,/g, '');
  } else if (coma >= 0) {
    s = /^\d{1,3}(?:,\d{3})+$/.test(s) ? s.replace(/,/g, '') : s.replace(/,/g, '.');
  } else if (punto >= 0 && /^\d{1,3}(?:\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  return Number(s);
}

export function extraerMonto(texto: string): number | null {
  const t = quitarFechas(normalizar(texto)).replace(/\d+(?:[.,]\d+)?\s*%/g, ' ');
  const patron = /(\$\s*)?(\d[\d.,]*)(\s*(?:mil|k)\b)?/g;
  let primero: number | null = null;
  let m = patron.exec(t);
  while (m !== null) {
    const bruto = (m[2] ?? '').replace(/[.,]+$/, '');
    if (bruto.length > 0) {
      let n = interpretarNumero(bruto);
      if (Number.isFinite(n) && n > 0) {
        if (m[3]) n *= 1000;
        if (m[1]) return n;
        if (primero === null) primero = n;
      }
    }
    m = patron.exec(t);
  }
  if (primero !== null) return primero;
  return /\bmil\b/.test(t) ? 1000 : null;
}

function preguntaRegistro(t: string): boolean {
  if (/\b(?:registrar|tramitar)\s+(?:mi\s+)?rfc\b/.test(t)) return true;
  if (/\balta\s+(?:de\s+|del\s+)?rfc\b/.test(t)) return true;
  return (
    /\b(?:como|donde)\b/.test(t) &&
    /\b(?:registro|registrar|tramito|tramitar|saco|sacar|alta)\b/.test(t)
  );
}

function rfcNegativo(t: string): boolean {
  return (
    /\bsin\s+(?:mi\s+)?rfc\b/.test(t) ||
    /\bno\s+(?:tengo|tienes|cuento\s+con|hay|traigo)\s+(?:mi\s+)?rfc\b/.test(t) ||
    /\bno\s+rfc\b/.test(t)
  );
}

function esComparador(t: string): boolean {
  if (/\bdefinitivo\b/.test(t) && /\bprovisional\b/.test(t)) return true;
  return (
    /\b(?:que|cual)\s+(?:me\s+)?conviene\b/.test(t) ||
    /\b(?:que|cual)\s+esquema\b/.test(t) ||
    /\bcual\s+es\s+mejor\b/.test(t)
  );
}

function esRetenciones(t: string): boolean {
  return (
    /\bcuanto\s+me\s+(?:retienen|quitan|descuentan|depositan|pagan|queda|regresan)\b/.test(t) ||
    /\bretencion(?:es)?\b/.test(t)
  );
}

function resultado(intencion: Intencion, monto: number | null, conRFC?: boolean): ResultadoMensaje {
  const r: ResultadoMensaje = { intencion };
  if (monto !== null) r.monto = monto;
  if (typeof conRFC === 'boolean') r.conRFC = conRFC;
  return r;
}

export function parsearMensaje(texto: string): ResultadoMensaje {
  const t = normalizar(texto);
  const mencionaRFC = /\brfc\b/.test(t);
  if (mencionaRFC && preguntaRegistro(t)) return resultado('registroRFC', null);
  const conRFC = mencionaRFC ? !rfcNegativo(t) : undefined;
  const monto = extraerMonto(texto);
  if (esComparador(t)) return resultado('comparador', monto, conRFC);
  if (esRetenciones(t)) return resultado('retenciones', monto, conRFC);
  if (/\b(?:gasolina|gas|combustible|gasolinera)\b/.test(t)) {
    return resultado('gasolina', monto, conRFC);
  }
  if (
    /\b(?:gane|ganancia|ganancias|ingreso|ingresos|cobre|facture)\b/.test(t) ||
    /\bme\s+(?:pagaron|depositaron|cayeron)\b/.test(t)
  ) {
    return resultado('ingreso', monto, conRFC);
  }
  if (monto !== null) return resultado('ingreso', monto, conRFC);
  if (mencionaRFC) return resultado('rfc', null, conRFC);
  return resultado('ayuda', null);
}