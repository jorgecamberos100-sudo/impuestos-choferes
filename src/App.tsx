import { useEffect, useState } from 'react';
import CalculadoraRetenciones from './components/CalculadoraRetenciones';
import ComparadorEsquemas from './components/ComparadorEsquemas';
import { LEYENDA_ESTIMACION, VIGENCIA, VIGENCIA_TEXTO } from './lib/tasas';

type Seccion = 'retenciones' | 'comparador';

const ESTILOS_GLOBALES = `
:root { color-scheme: dark; }
html { scroll-behavior: smooth; }
body { margin: 0; background-color: #0A0A0C; color: #F7F7F8; }
::selection { background: rgba(37, 99, 235, 0.5); color: #F7F7F8; }
* { scrollbar-width: thin; scrollbar-color: #1E3A8A #0A0A0C; }
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-track { background: #0A0A0C; }
*::-webkit-scrollbar-thumb { background: #1E3A8A; border-radius: 9999px; border: 2px solid #0A0A0C; }
*::-webkit-scrollbar-thumb:hover { background: #2563EB; }
select option { background-color: #12121A; color: #F7F7F8; }
input::placeholder { color: #6B7280; opacity: 1; }
@keyframes mv-aparecer {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes mv-flotar {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(3%, 5%, 0) scale(1.05); }
}
.mv-entrada { animation: mv-aparecer 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
.mv-visible { animation: mv-aparecer 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
.mv-flotar { animation: mv-flotar 18s ease-in-out infinite; }
.mv-flotar-lento { animation: mv-flotar 26s ease-in-out infinite reverse; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .mv-entrada, .mv-visible, .mv-flotar, .mv-flotar-lento { animation: none !important; }
}
`;

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

function IconoFlechaArriba({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function Chip({ texto }: { texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#9CA3AF]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" aria-hidden="true" />
      {texto}
    </span>
  );
}

export default function App() {
  const [seccionActiva, setSeccionActiva] = useState<Seccion>('retenciones');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const porRevelar = Array.from(document.querySelectorAll<HTMLElement>('.mv-revelar'));
    const observadorRevelar = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('mv-visible');
            observadorRevelar.unobserve(entrada.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    porRevelar.forEach((elemento) => observadorRevelar.observe(elemento));

    const secciones = (['retenciones', 'comparador'] as const)
      .map((id) => document.getElementById(id))
      .filter((elemento): elemento is HTMLElement => elemento !== null);

    const observadorSeccion = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setSeccionActiva(entrada.target.id === 'comparador' ? 'comparador' : 'retenciones');
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );
    secciones.forEach((elemento) => observadorSeccion.observe(elemento));

    return () => {
      observadorRevelar.disconnect();
      observadorSeccion.disconnect();
    };
  }, []);

  const volverArriba = () => {
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducido ? 'auto' : 'smooth' });
  };

  const claseEnlace = (activa: boolean): string =>
    `rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] sm:text-sm ${
      activa
        ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/25'
        : 'text-[#9CA3AF] hover:text-[#F7F7F8]'
    }`;

  return (
    <div className="relative min-h-screen bg-[#0A0A0C] text-[#F7F7F8] antialiased">
      <style>{ESTILOS_GLOBALES}</style>

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="mv-flotar absolute -top-44 left-1/2 -ml-[360px] h-[440px] w-[720px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #2563EB, transparent 72%)' }}
        />
        <div
          className="mv-flotar-lento absolute -bottom-56 -right-44 h-[480px] w-[600px] rounded-full opacity-[0.13] blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #7C3AED, transparent 72%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(247,247,248,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(247,247,248,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage:
              'radial-gradient(ellipse 90% 65% at 50% 0%, black 15%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 65% at 50% 0%, black 15%, transparent 75%)',
          }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.035]">
          <filter id="mv-ruido">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#mv-ruido)" />
        </svg>
      </div>

      <div className="relative z-10">
        <header className="mx-auto w-full max-w-5xl px-4 pb-6 pt-8 sm:pt-12">
          <div className="mv-entrada flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-[#2563EB]/30"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1E40AF)' }}
            >
              <IconoVolante className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">MiVolante</h1>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#93C5FD]">
                Impuestos para choferes de app
              </p>
            </div>
          </div>
          <p
            className="mv-entrada mt-4 max-w-2xl text-sm leading-relaxed text-[#9CA3AF] sm:text-base"
            style={{ animationDelay: '70ms' }}
          >
            Calcula lo que te retiene la plataforma y qué esquema te conviene. Gratis, sin cuenta y
            sin tus claves del SAT.
          </p>
          <div
            className="mv-entrada mt-4 flex flex-wrap gap-2"
            style={{ animationDelay: '140ms' }}
          >
            <Chip texto={`Tasas SAT ${VIGENCIA.slice(0, 4)}`} />
            <Chip texto={`Vigentes al ${VIGENCIA_TEXTO}`} />
            <Chip texto="Todo se calcula en tu dispositivo" />
          </div>
        </header>

        <nav
          aria-label="Secciones de la calculadora"
          className="sticky top-0 z-40 border-b border-white/5 bg-[#0A0A0C]/80 backdrop-blur-md"
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: 'linear-gradient(135deg, #2563EB, #1E40AF)' }}
              >
                <IconoVolante className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-bold tracking-tight sm:block">MiVolante</span>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#12121A] p-1">
                <a
                  href="#retenciones"
                  aria-current={seccionActiva === 'retenciones' ? 'location' : undefined}
                  onClick={() => setSeccionActiva('retenciones')}
                  className={claseEnlace(seccionActiva === 'retenciones')}
                >
                  Retenciones
                </a>
                <a
                  href="#comparador"
                  aria-current={seccionActiva === 'comparador' ? 'location' : undefined}
                  onClick={() => setSeccionActiva('comparador')}
                  className={claseEnlace(seccionActiva === 'comparador')}
                >
                  Comparador
                </a>
              </div>
            </div>
            <p className="hidden shrink-0 text-xs text-[#9CA3AF] lg:block">
              Vigente al {VIGENCIA_TEXTO}
            </p>
          </div>
        </nav>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
          <div className="space-y-12 sm:space-y-16">
            <div id="retenciones" className="mv-revelar scroll-mt-24">
              <CalculadoraRetenciones />
            </div>
            <div
              aria-hidden="true"
              className="h-px w-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(37,99,235,0.35), transparent)',
              }}
            />
            <div id="comparador" className="mv-revelar scroll-mt-24">
              <ComparadorEsquemas />
            </div>
          </div>

        </main>

        <footer className="border-t border-white/5">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconoVolante className="h-4 w-4 text-[#93C5FD]" />
                <span className="text-sm font-bold tracking-tight">MiVolante</span>
              </div>
              <button
                type="button"
                onClick={volverArriba}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] active:scale-95"
              >
                <IconoFlechaArriba className="h-3.5 w-3.5" />
                Volver arriba
              </button>
            </div>
            <div className="mt-4 max-w-3xl space-y-2.5">
              <p className="text-xs leading-relaxed text-[#9CA3AF]">{LEYENDA_ESTIMACION}</p>
              <p className="text-xs text-[#9CA3AF]">
                Tasas vigentes desde el{' '}
                <time dateTime={VIGENCIA} className="font-medium text-[#F7F7F8]">
                  {VIGENCIA_TEXTO}
                </time>
                .
              </p>
              <p className="text-xs leading-relaxed text-[#9CA3AF]">
                Los cálculos usan las tasas 2026 del SAT (régimen de plataformas tecnológicas, clave
                625).
              </p>
              <p className="text-xs text-[#9CA3AF]/80">
                Tus números no salen de tu dispositivo: no hay cuentas, ni base de datos, ni
                rastreo.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}