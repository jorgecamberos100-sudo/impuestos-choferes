import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { calcularRetenciones } from '../lib/calculos';
import {
  ISR_RETENCION_TRANSPORTE,
  ISR_SIN_RFC,
  IVA_GENERAL,
  IVA_RETENIDO_CON_RFC,
  IVA_SIN_RFC,
  LEYENDA_ESTIMACION,
  PLATAFORMAS,
} from '../lib/tasas';

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const MXN_ENTERO = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const ATAJOS: readonly string[] = ['8000', '15000', '25000'];

function porcentaje(fraccion: number): string {
  return `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(fraccion * 100)}%`;
}

function sanearDecimal(texto: string): string {
  const limpio = texto.replace(',', '.').replace(/[^0-9.]/g, '');
  const punto = limpio.indexOf('.');
  const normalizado =
    punto === -1 ? limpio : limpio.slice(0, punto + 1) + limpio.slice(punto + 1).replace(/\./g, '');
  return normalizado.slice(0, 12);
}

function ingresoValido(texto: string): number | null {
  if (texto.trim() === '' || texto === '.') return null;
  const numero = Number(texto);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

function MontoAnimado({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState<number>(valor);
  const actual = useRef<number>(valor);

  useEffect(() => {
    const destino = valor;
    const desde = actual.current;
    if (desde === destino) return;

    const prefiereReducido =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefiereReducido) {
      actual.current = destino;
      setMostrado(destino);
      return;
    }

    let raf = 0;
    const inicio = performance.now();
    const duracion = 450;

    const animar = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = 1 - Math.pow(1 - avance, 3);
      const intermedio = desde + (destino - desde) * suavizado;
      actual.current = intermedio;
      setMostrado(intermedio);
      if (avance < 1) raf = requestAnimationFrame(animar);
    };

    raf = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  return <span className="tabular-nums">{MXN.format(mostrado)}</span>;
}

function IconoVolante({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.7" />
      <path d="M3 12h6.3" />
      <path d="M14.7 12H21" />
      <path d="M12 14.7V21" />
    </svg>
  );
}

function IconoAlerta({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 4.5 20.5 19.5H3.5L12 4.5Z" />
      <path d="M12 10.5v3.5" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}

function Fila({
  etiqueta,
  monto,
  ayuda,
  punto,
}: {
  etiqueta: string;
  monto: string;
  ayuda?: string;
  punto?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="min-w-0 text-sm text-[#9CA3AF]">
        <span className="flex items-center gap-2">
          {punto ? <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${punto}`} /> : null}
          <span>{etiqueta}</span>
        </span>
        {ayuda ? (
          <span className={`mt-0.5 block text-[11px] text-[#9CA3AF]/70 ${punto ? 'pl-4' : ''}`}>
            {ayuda}
          </span>
        ) : null}
      </dt>
      <dd className="shrink-0 text-sm font-semibold tabular-nums text-[#F7F7F8]">{monto}</dd>
    </div>
  );
}

export default function CalculadoraRetenciones() {
  const id = useId();
  const [ingreso, setIngreso] = useState<string>('15000');
  const [plataforma, setPlataforma] = useState<string>(PLATAFORMAS[0] ?? 'Uber');
  const [conRFC, setConRFC] = useState<boolean>(true);

  const ingresoNumero = useMemo(() => ingresoValido(ingreso), [ingreso]);

  const resultado = useMemo(
    () =>
      ingresoNumero === null
        ? null
        : calcularRetenciones({ ingresoConIVA: ingresoNumero, conRFC }),
    [ingresoNumero, conRFC],
  );

  const referenciaConRFC = useMemo(
    () =>
      ingresoNumero === null || conRFC
        ? null
        : calcularRetenciones({ ingresoConIVA: ingresoNumero, conRFC: true }),
    [ingresoNumero, conRFC],
  );

  return (
    <section aria-labelledby={`${id}-titulo`}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2563EB]/40 bg-[#2563EB]/20 text-sm font-bold text-[#93C5FD]">
          1
        </span>
        <div>
          <h2
            id={`${id}-titulo`}
            className="text-xl font-bold tracking-tight text-[#F7F7F8] sm:text-2xl"
          >
            Calculadora de retenciones
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
            Lo que la plataforma retiene para el SAT y lo que realmente llega a tu cuenta cada mes.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[5fr_7fr]">
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
            Tus datos
          </h3>

          <div className="mt-4 space-y-5">
            <div>
              <label
                htmlFor={`${id}-ingreso`}
                className="block text-sm font-medium leading-snug text-[#F7F7F8]"
              >
                Ingreso mensual con IVA incluido (lo que paga el pasajero)
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-[#9CA3AF]">
                  $
                </span>
                <input
                  id={`${id}-ingreso`}
                  type="text"
                  inputMode="decimal"
                  min={0}
                  autoComplete="off"
                  enterKeyHint="done"
                  value={ingreso}
                  onChange={(evento) => setIngreso(sanearDecimal(evento.target.value))}
                  placeholder="15000"
                  aria-describedby={`${id}-ingreso-ayuda`}
                  className="w-full rounded-xl border border-white/10 bg-[#0A0A0C] py-3 pl-9 pr-16 text-base text-[#F7F7F8] outline-none transition placeholder:text-[#6B7280] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/40"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[#9CA3AF]">
                  MXN
                </span>
              </div>
              <p id={`${id}-ingreso-ayuda`} className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
                Suma de todos tus viajes o entregas del mes. El IVA de {porcentaje(IVA_GENERAL)} ya
                viene incluido; aquí lo separamos por ti.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">Atajos:</span>
                {ATAJOS.map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setIngreso(valor)}
                    className="rounded-full bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] active:scale-95"
                  >
                    {MXN_ENTERO.format(Number(valor))}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIngreso('')}
                  className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-[#9CA3AF] transition hover:border-white/40 hover:text-[#F7F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] active:scale-95"
                >
                  Borrar
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor={`${id}-plataforma`}
                className="block text-sm font-medium text-[#F7F7F8]"
              >
                Plataforma en la que trabajas
              </label>
              <div className="relative mt-2">
                <select
                  id={`${id}-plataforma`}
                  value={plataforma}
                  onChange={(evento) => setPlataforma(evento.target.value)}
                  aria-describedby={`${id}-plataforma-ayuda`}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0A0A0C] py-3 pl-4 pr-10 text-base text-[#F7F7F8] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/40"
                >
                  {PLATAFORMAS.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <p
                id={`${id}-plataforma-ayuda`}
                className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]"
              >
                {PLATAFORMAS.join(', ')} retienen lo mismo: {porcentaje(ISR_RETENCION_TRANSPORTE)} de
                ISR sobre tu ingreso sin IVA.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0A0A0C] p-4">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor={`${id}-rfc`}
                  className="cursor-pointer text-sm font-medium leading-snug text-[#F7F7F8]"
                >
                  Tengo mi RFC registrado en la plataforma
                </label>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${conRFC ? 'text-[#93C5FD]' : 'text-amber-300'}`}
                  >
                    {conRFC ? 'Sí' : 'No'}
                  </span>
                  <button
                    id={`${id}-rfc`}
                    type="button"
                    role="switch"
                    aria-checked={conRFC}
                    onClick={() => setConRFC(!conRFC)}
                    className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                      conRFC ? 'bg-[#2563EB]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                        conRFC ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">
                {conRFC
                  ? `Con RFC: ${porcentaje(ISR_RETENCION_TRANSPORTE)} de ISR y ${porcentaje(IVA_RETENIDO_CON_RFC)} de IVA sobre la base sin IVA.`
                  : `Sin RFC: ${porcentaje(ISR_SIN_RFC)} de ISR y ${porcentaje(IVA_SIN_RFC)} de IVA sobre la base sin IVA.`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
              Tu desglose
            </h3>
            {resultado !== null ? (
              <span
                className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  conRFC
                    ? 'border-[#2563EB]/40 bg-[#2563EB]/20 text-[#93C5FD]'
                    : 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                }`}
              >
                {conRFC ? 'Con RFC' : 'Sin RFC'}
              </span>
            ) : null}
          </div>

          {resultado === null || ingresoNumero === null ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0A0A0C]/60 px-6 py-12 text-center">
              <IconoVolante className="h-10 w-10 text-[#2563EB]/60" />
              <p className="mt-4 text-sm font-medium text-[#9CA3AF]">
                Escribe tu ingreso mensual para ver el cálculo
              </p>
              <p className="mt-1 text-xs text-[#9CA3AF]/70">
                El desglose aparece al instante, sin botones ni registros.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <dl className="divide-y divide-white/5">
                <Fila
                  etiqueta="Base sin IVA"
                  ayuda={`Tu ingreso antes del IVA de ${porcentaje(IVA_GENERAL)}`}
                  monto={MXN.format(resultado.base)}
                />
                <Fila
                  etiqueta={`ISR retenido (${porcentaje(resultado.tasaISR)})`}
                  punto="bg-amber-400"
                  monto={MXN.format(-resultado.isr)}
                />
                <Fila
                  etiqueta={`IVA retenido (${porcentaje(resultado.tasaIVA)})`}
                  punto="bg-violet-400"
                  monto={MXN.format(-resultado.iva)}
                />
              </dl>

              <div className="mt-5">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.max(0, (resultado.deposito / ingresoNumero) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${Math.max(0, (resultado.isr / ingresoNumero) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-violet-400 transition-all duration-500"
                    style={{ width: `${Math.max(0, (resultado.iva / ingresoNumero) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#9CA3AF]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    Te depositan {porcentaje(resultado.deposito / ingresoNumero)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                    ISR {porcentaje(resultado.isr / ingresoNumero)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden="true" />
                    IVA {porcentaje(resultado.iva / ingresoNumero)}
                  </span>
                </div>
              </div>

              <div
                className="mt-5 rounded-xl border border-[#2563EB]/30 p-5"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(37,99,235,0.04) 60%, rgba(52,211,153,0.08))',
                }}
              >
                <p className="text-sm font-medium text-[#9CA3AF]">Te depositan</p>
                <p
                  className="mt-1 text-4xl font-bold tracking-tight text-emerald-300 sm:text-[44px] sm:leading-tight"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span aria-hidden="true">
                    <MontoAnimado valor={resultado.deposito} />
                  </span>
                  <span className="sr-only">{MXN.format(resultado.deposito)}</span>
                </p>
                <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">
                  De {MXN.format(ingresoNumero)} brutos, {plataforma} retiene{' '}
                  {MXN.format(resultado.isr + resultado.iva)} para el SAT (
                  {porcentaje((resultado.isr + resultado.iva) / ingresoNumero)} de tu ingreso) y te
                  deposita el resto.
                </p>
              </div>

              {!conRFC ? (
                <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <IconoAlerta className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug text-amber-200">
                        Sin RFC te retienen el 36% de tu ingreso. Registrar tu RFC en la app es el
                        ahorro más grande que puedes hacer.
                      </p>
                      {referenciaConRFC !== null ? (
                        <p className="mt-2 text-xs leading-relaxed text-amber-100/80">
                          Con tu RFC registrado te depositarían {MXN.format(referenciaConRFC.deposito)}:
                          recuperarías {MXN.format(referenciaConRFC.deposito - resultado.deposito)}{' '}
                          cada mes.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <p className="mt-4 text-[11px] leading-relaxed text-[#9CA3AF]/80">
                Esta estimación no descuenta la comisión de {plataforma}; solo las retenciones de
                impuestos.
              </p>
              <p className="mt-2 border-t border-white/5 pt-3 text-[11px] leading-relaxed text-[#9CA3AF]">
                {LEYENDA_ESTIMACION}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}