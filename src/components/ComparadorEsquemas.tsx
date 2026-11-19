import { useId, useMemo, useState } from 'react';
import { compararEsquemas } from '../lib/calculos';
import {
  ISR_RETENCION_TRANSPORTE,
  IVA_GENERAL,
  IVA_RETENIDO_CON_RFC,
  LEYENDA_ESTIMACION,
  UMBRAL_DEFINITIVO_ANUAL,
} from '../lib/tasas';

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const MXN_ENTERO = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

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

function IconoCheck({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 5-5.5" />
    </svg>
  );
}

function IconoInfo({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function IconoBarras({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 20v-6" />
      <path d="M12 20V6" />
      <path d="M19 20v-9" />
      <path d="M3 20h18" />
    </svg>
  );
}

function Fila({
  etiqueta,
  monto,
  ayuda,
  tono = 'normal',
}: {
  etiqueta: string;
  monto: string;
  ayuda?: string;
  tono?: 'normal' | 'exito';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="min-w-0">
        <span className="block text-sm text-[#9CA3AF]">{etiqueta}</span>
        {ayuda ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-[#9CA3AF]/70">{ayuda}</span>
        ) : null}
      </dt>
      <dd
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          tono === 'exito' ? 'text-emerald-300' : 'text-[#F7F7F8]'
        }`}
      >
        {monto}
      </dd>
    </div>
  );
}

function Etiqueta({
  tono,
  texto,
}: {
  tono: 'exito' | 'alerta' | 'neutral' | 'azul';
  texto: string;
}) {
  const estilos: Record<'exito' | 'alerta' | 'neutral' | 'azul', string> = {
    exito: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    alerta: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    neutral: 'border-white/10 bg-white/5 text-[#9CA3AF]',
    azul: 'border-[#2563EB]/40 bg-[#2563EB]/20 text-[#93C5FD]',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${estilos[tono]}`}
    >
      {texto}
    </span>
  );
}

function BarraComparacion({
  etiqueta,
  monto,
  fraccion,
  ganador,
}: {
  etiqueta: string;
  monto: number;
  fraccion: number;
  ganador: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs text-[#9CA3AF]">{etiqueta}</span>
      <div className="h-2 grow overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            ganador ? 'bg-emerald-400' : 'bg-[#60A5FA]'
          }`}
          style={{ width: `${Math.min(100, Math.max(2, fraccion * 100))}%` }}
        />
      </div>
      <span
        className={`w-24 shrink-0 text-right text-xs font-semibold tabular-nums ${
          ganador ? 'text-emerald-300' : 'text-[#F7F7F8]'
        }`}
      >
        {MXN.format(monto)}
      </span>
    </div>
  );
}

function CampoMonto({
  id,
  etiqueta,
  ayuda,
  valor,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  ayuda: string;
  valor: string;
  alCambiar: (texto: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium leading-snug text-[#F7F7F8]">
        {etiqueta}
      </label>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-[#9CA3AF]">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          min={0}
          autoComplete="off"
          enterKeyHint="done"
          value={valor}
          onChange={(evento) => alCambiar(sanearDecimal(evento.target.value))}
          placeholder="0"
          aria-describedby={`${id}-ayuda`}
          className="w-full rounded-xl border border-white/10 bg-[#0A0A0C] py-3 pl-9 pr-16 text-base text-[#F7F7F8] outline-none transition placeholder:text-[#6B7280] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/40"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-[#9CA3AF]">
          MXN
        </span>
      </div>
      <p id={`${id}-ayuda`} className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
        {ayuda}
      </p>
    </div>
  );
}

function ResultadosComparador({
  ingreso,
  conCFDI,
  resultado,
}: {
  ingreso: number;
  conCFDI: boolean;
  resultado: ReturnType<typeof compararEsquemas>;
}) {
  const { definitivo: d, provisional: p, diferencia, recomendacion, definitivoDisponible } = resultado;

  const anual = ingreso * 12;
  const fraccionLimite = anual / UMBRAL_DEFINITIVO_ANUAL;
  const colorBarra = !definitivoDisponible
    ? '#F87171'
    : fraccionLimite >= 0.85
      ? '#FBBF24'
      : '#2563EB';

  const empate = Math.abs(diferencia) < 0.005;
  const ganaDefinitivo = recomendacion === 'definitivo' && !empate;
  const ganaProvisional = recomendacion === 'provisional' && !empate;

  const maximo = Math.max(d.total, p.totalPorPagar, 0.01);

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#12121A] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-medium text-[#F7F7F8]">
            Ingreso anualizado:{' '}
            <span className="font-bold tabular-nums">{MXN_ENTERO.format(anual)}</span>
          </p>
          <p className="text-xs text-[#9CA3AF]">
            Límite del pago definitivo: {MXN_ENTERO.format(UMBRAL_DEFINITIVO_ANUAL)} al año
          </p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, fraccionLimite * 100)}%`,
              backgroundColor: colorBarra,
            }}
          />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#9CA3AF]">
          {!definitivoDisponible ? (
            <span className="text-red-300">
              Superas el límite por {MXN_ENTERO.format(anual - UMBRAL_DEFINITIVO_ANUAL)}: el pago
              definitivo ya no está disponible.
            </span>
          ) : fraccionLimite >= 0.85 ? (
            <span className="text-amber-300">
              Vas en el {porcentaje(fraccionLimite)} del límite: te acercas al tope del pago
              definitivo.
            </span>
          ) : (
            <>Vas en el {porcentaje(fraccionLimite)} del límite: aún puedes elegir pago definitivo.</>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
        <article
          className={`flex flex-col rounded-2xl border bg-[#12121A] p-5 transition sm:p-6 ${
            ganaDefinitivo ? 'border-emerald-400/40' : 'border-white/10'
          }`}
          style={ganaDefinitivo ? { boxShadow: '0 0 50px rgba(52,211,153,0.07)' } : undefined}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-[#F7F7F8]">Pago definitivo</h3>
            {!definitivoDisponible ? (
              <Etiqueta tono="alerta" texto="No disponible" />
            ) : ganaDefinitivo ? (
              <Etiqueta tono="exito" texto="Te conviene" />
            ) : (
              <Etiqueta tono="neutral" texto="Disponible" />
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Las retenciones son tu impuesto final, sin deducciones y sin declaración mensual.
          </p>

          {definitivoDisponible ? (
            <>
              <dl className="mt-4 divide-y divide-white/5">
                <Fila
                  etiqueta="ISR retenido"
                  ayuda={`${porcentaje(ISR_RETENCION_TRANSPORTE)} de tu base sin IVA`}
                  monto={MXN.format(d.isrRetenido)}
                />
                <Fila
                  etiqueta="IVA retenido"
                  ayuda={`${porcentaje(IVA_RETENIDO_CON_RFC)} de tu base sin IVA`}
                  monto={MXN.format(d.ivaRetenido)}
                />
              </dl>
              <div className="mt-4 rounded-xl bg-[#0A0A0C] p-4 text-xs leading-relaxed text-[#9CA3AF]">
                Ideal si no quieres presentar declaraciones mensuales ni juntar facturas de gastos.
              </div>
              <div className="mt-auto pt-5">
                <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                  <span className="text-sm font-semibold text-[#F7F7F8]">Total de impuestos</span>
                  <span className="text-2xl font-bold tabular-nums text-[#F7F7F8]">
                    {MXN.format(d.total)}
                  </span>
                </div>
                <p className="mt-1 text-right text-[11px] text-[#9CA3AF]">
                  {porcentaje(d.total / ingreso)} de tu ingreso bruto
                </p>
              </div>
            </>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
              <IconoAlerta className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
              <p className="text-sm leading-snug text-amber-200">
                No disponible: tus ingresos anualizados superan{' '}
                {MXN_ENTERO.format(UMBRAL_DEFINITIVO_ANUAL)} al año, así que no puedes elegir pago
                definitivo.
              </p>
            </div>
          )}

          <div className="mt-auto pt-4">
            <p className="border-t border-white/5 pt-3 text-[11px] leading-relaxed text-[#9CA3AF]">
              {LEYENDA_ESTIMACION}
            </p>
          </div>
        </article>

        <article
          className={`flex flex-col rounded-2xl border bg-[#12121A] p-5 transition sm:p-6 ${
            ganaProvisional || !definitivoDisponible ? 'border-emerald-400/40' : 'border-white/10'
          }`}
          style={
            ganaProvisional || !definitivoDisponible
              ? { boxShadow: '0 0 50px rgba(52,211,153,0.07)' }
              : undefined
          }
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-[#F7F7F8]">Pagos provisionales</h3>
            {ganaProvisional ? (
              <Etiqueta tono="exito" texto="Te conviene" />
            ) : !definitivoDisponible ? (
              <Etiqueta tono="azul" texto="Tu única opción" />
            ) : (
              <Etiqueta tono="neutral" texto="Disponible" />
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
            Declara cada mes antes del día 17 y sí puedes deducir.
          </p>

          <dl className="mt-4 divide-y divide-white/5">
            <Fila
              etiqueta="Base gravable"
              ayuda="Ingreso sin IVA menos tus deducciones"
              monto={MXN.format(p.baseGravable)}
            />
            <Fila
              etiqueta="ISR causado"
              ayuda="Tarifa mensual del artículo 96 de la LISR"
              monto={MXN.format(p.isrCausado)}
            />
            <Fila
              etiqueta="ISR por pagar"
              ayuda="Menos lo retenido por la plataforma"
              monto={MXN.format(p.isrPorPagar)}
              tono={p.isrPorPagar < 0 ? 'exito' : 'normal'}
            />
            <Fila
              etiqueta="IVA trasladado"
              ayuda={`El IVA de ${porcentaje(IVA_GENERAL)} que cobraste`}
              monto={MXN.format(p.ivaTrasladado)}
            />
            <Fila
              etiqueta="IVA acreditable"
              ayuda={conCFDI ? 'IVA de tu gasolina con factura' : 'Sin CFDI no puedes acreditar IVA'}
              monto={MXN.format(p.ivaAcreditable)}
            />
            <Fila
              etiqueta="IVA retenido"
              ayuda={`${porcentaje(IVA_RETENIDO_CON_RFC)} que retuvo la plataforma`}
              monto={MXN.format(p.ivaRetenido)}
            />
            <Fila
              etiqueta={p.ivaPorPagar < 0 ? 'Saldo a favor de IVA' : 'IVA por pagar'}
              ayuda={
                p.ivaPorPagar < 0
                  ? 'Se compensa o se pide en devolución'
                  : 'Trasladado menos acreditable y retenido'
              }
              monto={MXN.format(Math.abs(p.ivaPorPagar))}
              tono={p.ivaPorPagar < 0 ? 'exito' : 'normal'}
            />
          </dl>

          <div className="mt-auto pt-5">
            <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
              <span className="text-sm font-semibold text-[#F7F7F8]">Total a pagar</span>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  p.totalPorPagar < 0 ? 'text-emerald-300' : 'text-[#F7F7F8]'
                }`}
              >
                {MXN.format(p.totalPorPagar)}
              </span>
            </div>
            <p className="mt-1 text-right text-[11px] text-[#9CA3AF]">
              {porcentaje(p.totalPorPagar / ingreso)} de tu ingreso bruto
            </p>
          </div>

          <div className="pt-4">
            <p className="border-t border-white/5 pt-3 text-[11px] leading-relaxed text-[#9CA3AF]">
              {LEYENDA_ESTIMACION}
            </p>
          </div>
        </article>
      </div>

      {recomendacion === 'no-disponible' ? (
        <div
          className="rounded-2xl border border-amber-400/30 p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(37,99,235,0.06))',
          }}
        >
          <div className="flex items-start gap-3">
            <IconoInfo className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-snug text-[#F7F7F8]">
                Solo puedes usar pagos provisionales.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
                Con ingresos anualizados arriba de {MXN_ENTERO.format(UMBRAL_DEFINITIVO_ANUAL)},
                presenta tu declaración cada mes antes del día 17.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl border p-5 ${
            empate ? 'border-[#2563EB]/40' : 'border-emerald-400/30'
          }`}
          style={{
            background: empate
              ? 'linear-gradient(135deg, rgba(37,99,235,0.14), rgba(124,58,237,0.08))'
              : 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(37,99,235,0.08))',
          }}
        >
          <div className="flex items-start gap-3">
            {empate ? (
              <IconoInfo className="mt-0.5 h-5 w-5 shrink-0 text-[#93C5FD]" />
            ) : (
              <IconoCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            )}
            <div className="min-w-0 grow">
              <p className="text-lg font-bold leading-snug text-[#F7F7F8] sm:text-xl">
                {empate ? (
                  <>Con tus números, ambos esquemas cuestan lo mismo este mes.</>
                ) : ganaProvisional ? (
                  <>
                    Con tus números, el esquema provisional te ahorra{' '}
                    <span className="text-emerald-300">{MXN.format(diferencia)}</span> al mes.
                  </>
                ) : (
                  <>
                    Con tus números, el pago definitivo te sale más barato por{' '}
                    <span className="text-emerald-300">{MXN.format(Math.abs(diferencia))}</span> al
                    mes.
                  </>
                )}
              </p>
              <div className="mt-4 space-y-2">
                <BarraComparacion
                  etiqueta="Definitivo"
                  monto={d.total}
                  fraccion={d.total / maximo}
                  ganador={ganaDefinitivo}
                />
                <BarraComparacion
                  etiqueta="Provisional"
                  monto={p.totalPorPagar}
                  fraccion={Math.max(0, p.totalPorPagar) / maximo}
                  ganador={ganaProvisional}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-[#9CA3AF]">
        <IconoInfo className="mt-0.5 h-4 w-4 shrink-0 text-[#9CA3AF]" />
        El pago provisional real se calcula sobre tu ingreso acumulado del año; aquí estimamos el mes
        aislado.
      </p>
    </>
  );
}

export default function ComparadorEsquemas() {
  const id = useId();
  const [ingreso, setIngreso] = useState<string>('15000');
  const [gasolina, setGasolina] = useState<string>('4000');
  const [conCFDI, setConCFDI] = useState<boolean>(true);

  const ingresoNumero = useMemo(() => ingresoValido(ingreso), [ingreso]);
  const gasolinaNumero = useMemo(() => ingresoValido(gasolina) ?? 0, [gasolina]);

  const resultado = useMemo(
    () =>
      ingresoNumero === null
        ? null
        : compararEsquemas({
            ingresoConIVA: ingresoNumero,
            gasolinaConIVA: gasolinaNumero,
            gasolinaConCFDI: conCFDI,
          }),
    [ingresoNumero, gasolinaNumero, conCFDI],
  );

  return (
    <section aria-labelledby={`${id}-titulo`}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2563EB]/40 bg-[#2563EB]/20 text-sm font-bold text-[#93C5FD]">
          2
        </span>
        <div>
          <h2
            id={`${id}-titulo`}
            className="text-xl font-bold tracking-tight text-[#F7F7F8] sm:text-2xl"
          >
            Comparador: definitivo vs. provisional
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[#9CA3AF]">
            Dos formas de pagar tus impuestos como chofer de app. Mete tus números y mira cuál te
            deja más dinero.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF]">
            Tus números
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <CampoMonto
              id={`${id}-ingreso`}
              etiqueta="Ingreso mensual con IVA incluido"
              ayuda="El total que pagan tus pasajeros o clientes en el mes, con todo e IVA."
              valor={ingreso}
              alCambiar={setIngreso}
            />
            <CampoMonto
              id={`${id}-gasolina`}
              etiqueta="Gasto mensual de gasolina con IVA"
              ayuda="Suma tus tickets de gasolina del mes. Si lo dejas vacío, contamos $0."
              valor={gasolina}
              alCambiar={setGasolina}
            />

            <div className="rounded-xl border border-white/10 bg-[#0A0A0C] p-4 sm:col-span-2">
              <label htmlFor={`${id}-cfdi`} className="flex cursor-pointer items-start gap-3">
                <input
                  id={`${id}-cfdi`}
                  type="checkbox"
                  checked={conCFDI}
                  onChange={(evento) => setConCFDI(evento.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#93C5FD] ${
                    conCFDI ? 'border-[#2563EB] bg-[#2563EB]' : 'border-white/20 bg-[#12121A]'
                  }`}
                >
                  {conCFDI ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-white"
                    >
                      <path d="m5 13 4 4 10-10" />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#F7F7F8]">
                    Tengo CFDI (factura) de la gasolina
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[#9CA3AF]">
                    Solo la gasolina facturada a tu RFC y pagada con tarjeta o transferencia es
                    deducible.
                  </span>
                </span>
              </label>
              {!conCFDI && gasolinaNumero > 0 ? (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-400/10 p-2.5 text-xs leading-relaxed text-amber-200">
                  <IconoAlerta className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  Sin factura, tu gasolina no reduce los impuestos en esta estimación.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {resultado === null || ingresoNumero === null ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#12121A] px-6 py-12 text-center">
            <IconoBarras className="h-10 w-10 text-[#2563EB]/60" />
            <p className="mt-4 text-sm font-medium text-[#9CA3AF]">
              Escribe tu ingreso mensual para ver la comparación.
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]/70">
              Comparamos ambos esquemas al instante, sin botones ni registros.
            </p>
          </div>
        ) : (
          <ResultadosComparador
            ingreso={ingresoNumero}
            conCFDI={conCFDI}
            resultado={resultado}
          />
        )}
      </div>
    </section>
  );
}