import { useState } from 'react';
import ChatMiVolante from './components/ChatMiVolante';
import CalculadoraRetenciones from './components/CalculadoraRetenciones';
import ComparadorEsquemas from './components/ComparadorEsquemas';
import { LEYENDA_ESTIMACION, VIGENCIA_TEXTO } from './lib/tasas';

type Vista = 'chat' | 'calculadora' | 'comparador';

const CSS_GLOBAL = `
  body { background: #0A0A0C; -webkit-tap-highlight-color: transparent; }
  ::selection { background: #2563EB; color: #F7F7F8; }
  .mv-scroll { scrollbar-width: thin; scrollbar-color: rgba(37,99,235,0.55) rgba(18,18,26,0.9); overscroll-behavior: contain; }
  .mv-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
  .mv-scroll::-webkit-scrollbar-track { background: rgba(18,18,26,0.9); border-radius: 8px; }
  .mv-scroll::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.55); border-radius: 8px; }
  .mv-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.85); }
  .mv-chips { scrollbar-width: none; }
  .mv-chips::-webkit-scrollbar { display: none; }
  @keyframes mv-baila {
    0% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-9px) rotate(140deg); }
    55% { transform: translateY(0) rotate(300deg); }
    78% { transform: translateY(-4px) rotate(360deg); }
    100% { transform: translateY(0) rotate(360deg); }
  }
  .mv-baila { animation: mv-baila 0.6s ease-in-out 3; }
  @keyframes mv-msg { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: none; } }
  .mv-msg { animation: mv-msg 0.22s ease-out both; }
  @keyframes mv-vista { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  .mv-vista { animation: mv-vista 0.25s ease-out both; }
  @keyframes mv-punto { 0%, 60%, 100% { transform: none; opacity: 0.35; } 30% { transform: translateY(-3px); opacity: 1; } }
  .mv-punto { animation: mv-punto 1s ease-in-out infinite; }
  .mv-punto:nth-child(2) { animation-delay: 0.15s; }
  .mv-punto:nth-child(3) { animation-delay: 0.3s; }
  @keyframes mv-pulso { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  .mv-pulso { animation: mv-pulso 2s ease-in-out infinite; }
  @keyframes mv-rec { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.75); opacity: 0.55; } }
  .mv-rec { animation: mv-rec 1s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .mv-baila, .mv-msg, .mv-vista, .mv-punto, .mv-pulso, .mv-rec { animation: none; }
  }
`;

function IconoAtras() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function BotonVolver({ alVolver }: { alVolver: () => void }) {
  return (
    <button
      type="button"
      onClick={alVolver}
      className="h-11 px-5 rounded-full bg-[#12121A] border border-white/10 hover:border-[#2563EB]/60 text-sm font-semibold text-[#F7F7F8] active:scale-95 transition flex items-center gap-2"
    >
      <IconoAtras />
      Volver al chat
    </button>
  );
}

export default function App() {
  const [vista, setVista] = useState<Vista>('chat');
  const volver = () => setVista('chat');

  return (
    <div
      className="h-screen w-full flex flex-col bg-[#0A0A0C] text-[#F7F7F8] font-sans antialiased"
      style={{
        height: '100dvh',
        backgroundImage:
          'radial-gradient(640px 320px at 50% -60px, rgba(37,99,235,0.12), transparent 70%)',
      }}
    >
      <style>{CSS_GLOBAL}</style>

      <header className="shrink-0 h-11 flex items-center justify-center gap-2 border-b border-white/5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.2" />
          <path d="M3.5 12h5M15.5 12h5M12 15.5v5" />
        </svg>
        <span className="text-sm font-semibold tracking-wide">MiVolante</span>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        <div className={vista === 'chat' ? 'flex flex-col flex-1 min-h-0' : 'hidden'}>
          <ChatMiVolante
            onVerDesglose={() => setVista('calculadora')}
            onVerComparacion={() => setVista('comparador')}
          />
        </div>

        {vista !== 'chat' && (
          <div className="flex-1 min-h-0 overflow-y-auto mv-scroll">
            <div className="max-w-md mx-auto px-4 pb-6 mv-vista">
              <div className="sticky top-0 z-10 bg-[#0A0A0C]/95 backdrop-blur pt-3 pb-2">
                <BotonVolver alVolver={volver} />
              </div>
              <div className="mt-2">
                {vista === 'calculadora' ? <CalculadoraRetenciones /> : <ComparadorEsquemas />}
              </div>
              <div className="mt-6">
                <BotonVolver alVolver={volver} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer
        className="shrink-0 border-t border-white/5 px-4 pt-1.5 text-center"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)' }}
      >
        <p className="text-[10px] leading-snug text-[#9CA3AF]">
          {VIGENCIA_TEXTO} · {LEYENDA_ESTIMACION}
        </p>
      </footer>
    </div>
  );
}