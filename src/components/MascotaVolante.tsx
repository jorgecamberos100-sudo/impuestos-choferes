import { useEffect, useId, useRef, useState } from 'react';

export type Personalidad = 'alegre' | 'tranquilo' | 'motivador';
export type TamanoMascota = 'compacto' | 'normal' | 'grande';

export interface ConfigMascota {
  nombre: string;
  personalidad: Personalidad;
  tamano: TamanoMascota;
}

export const CONFIG_MASCOTA_DEFECTO: ConfigMascota = {
  nombre: 'Volante',
  personalidad: 'alegre',
  tamano: 'normal',
};

export const ESCALA_TAMANO: Record<TamanoMascota, number> = {
  compacto: 0.85,
  normal: 1,
  grande: 1.2,
};

const CLAVE = 'mivolante:mascota';

const OPCIONES_PERSONALIDAD: { valor: Personalidad; etiqueta: string }[] = [
  { valor: 'alegre', etiqueta: 'Alegre' },
  { valor: 'tranquilo', etiqueta: 'Tranquilo' },
  { valor: 'motivador', etiqueta: 'Motivador' },
];

const OPCIONES_TAMANO: { valor: TamanoMascota; etiqueta: string }[] = [
  { valor: 'compacto', etiqueta: 'Compacto' },
  { valor: 'normal', etiqueta: 'Normal' },
  { valor: 'grande', etiqueta: 'Grande' },
];

const SUGERENCIAS = ['Volante', 'Volantito'];

export function leerConfigMascota(): ConfigMascota {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) {
      const j: unknown = JSON.parse(raw);
      if (typeof j === 'object' && j !== null) {
        const o = j as Record<string, unknown>;
        const nombre =
          typeof o.nombre === 'string' && o.nombre.trim().length > 0
            ? o.nombre.slice(0, 24)
            : CONFIG_MASCOTA_DEFECTO.nombre;
        const personalidad: Personalidad =
          o.personalidad === 'tranquilo' || o.personalidad === 'motivador'
            ? o.personalidad
            : 'alegre';
        const tamano: TamanoMascota =
          o.tamano === 'compacto' || o.tamano === 'grande' ? o.tamano : 'normal';
        return { nombre, personalidad, tamano };
      }
    }
  } catch {
    // Almacenamiento no disponible: usar valores por defecto.
  }
  return { ...CONFIG_MASCOTA_DEFECTO };
}

export function guardarConfigMascota(config: ConfigMascota): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(config));
  } catch {
    // Sin espacio o modo privado: la sesión sigue funcionando.
  }
}

function cara(p: Personalidad) {
  if (p === 'tranquilo') {
    return (
      <g>
        <path
          d="M24.8 29.5Q27 27.6 29.2 29.5M34.8 29.5Q37 27.6 39.2 29.5"
          fill="none"
          stroke="#F7F7F8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M27 35Q32 38.2 37 35"
          fill="none"
          stroke="#F7F7F8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (p === 'motivador') {
    return (
      <g>
        <path
          d="M24 25.6l4.6-1.2M40 25.6l-4.6-1.2"
          stroke="#F7F7F8"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="27" cy="29.8" r="2.4" fill="#F7F7F8" />
        <circle cx="37" cy="29.8" r="2.4" fill="#F7F7F8" />
        <path
          d="M25.8 34.2Q32 41 38.2 34.2"
          fill="none"
          stroke="#F7F7F8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    );
  }
  return (
    <g>
      <circle cx="27" cy="29.5" r="2.4" fill="#F7F7F8" />
      <circle cx="37" cy="29.5" r="2.4" fill="#F7F7F8" />
      <path
        d="M26 34.5Q32 40.5 38 34.5"
        fill="none"
        stroke="#F7F7F8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </g>
  );
}

function DibujoVolante({ personalidad }: { personalidad: Personalidad }) {
  const id = useId().replace(/:/g, '');
  const aro = `aro${id}`;
  const fondo = `fondo${id}`;
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" className="block" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={aro} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
        <radialGradient id={fondo} cx="0.35" cy="0.3" r="1">
          <stop offset="0" stopColor="#1B1B26" />
          <stop offset="1" stopColor="#12121A" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill={`url(#${fondo})`} stroke="rgba(247,247,248,0.10)" strokeWidth="1" />
      <circle cx="32" cy="32" r="21.5" fill="none" stroke={`url(#${aro})`} strokeWidth="6.5" />
      <path d="M13.5 32h6M44.5 32h6M32 44.5v6" stroke={`url(#${aro})`} strokeWidth="4.6" strokeLinecap="round" />
      <path
        d="M14.4 19.7A21.5 21.5 0 0 1 26.4 11.2"
        fill="none"
        stroke="#93C5FD"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="32" cy="32" r="12.5" fill="#0A0A0C" stroke="#2563EB" strokeWidth="1.6" />
      <circle cx="24.8" cy="34.6" r="2" fill="#2563EB" opacity="0.4" />
      <circle cx="39.2" cy="34.6" r="2" fill="#2563EB" opacity="0.4" />
      {cara(personalidad)}
    </svg>
  );
}

interface PropsAvatar {
  px: number;
  personalidad?: Personalidad;
  bailando?: boolean;
  onClick?: () => void;
  onFinBaile?: () => void;
  etiqueta?: string;
}

export function AvatarVolante({
  px,
  personalidad = 'alegre',
  bailando = false,
  onClick,
  onFinBaile,
  etiqueta = 'Mascota Volante',
}: PropsAvatar) {
  const clase = `shrink-0 rounded-full overflow-hidden ${bailando ? 'mv-baila' : ''} ${
    onClick
      ? 'active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]'
      : ''
  }`;
  const dibujo = <DibujoVolante personalidad={personalidad} />;
  if (onClick) {
    return (
      <button
        type="button"
        aria-label={etiqueta}
        onClick={onClick}
        onAnimationEnd={onFinBaile}
        className={clase}
        style={{ width: px, height: px }}
      >
        {dibujo}
      </button>
    );
  }
  return (
    <div aria-hidden="true" className={clase} style={{ width: px, height: px }} onAnimationEnd={onFinBaile}>
      {dibujo}
    </div>
  );
}

function IconoCerrar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function claseOpcion(activo: boolean): string {
  return `h-11 rounded-full text-sm font-medium border transition active:scale-95 ${
    activo
      ? 'bg-[#2563EB] border-transparent text-white'
      : 'bg-transparent border-white/10 text-[#9CA3AF] hover:text-[#F7F7F8] hover:border-white/25'
  }`;
}

interface PropsPanel {
  config: ConfigMascota;
  onCambiar: (c: ConfigMascota) => void;
  onCerrar: () => void;
}

export function PanelMascota({ config, onCambiar, onCerrar }: PropsPanel) {
  const [bailando, setBailando] = useState(false);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [onCerrar]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const bailar = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    setBailando(false);
    rafRef.current = window.requestAnimationFrame(() => setBailando(true));
    timerRef.current = window.setTimeout(() => setBailando(false), 2100);
  };

  const nombreVisible = config.nombre.trim() || 'Volante';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Tu mascota">
      <button type="button" aria-label="Cerrar" onClick={onCerrar} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="relative w-full sm:max-w-md bg-[#12121A] border border-white/10 rounded-t-3xl sm:rounded-3xl mv-vista max-h-[88dvh] overflow-y-auto mv-scroll">
        <div className="p-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#9CA3AF]">Tu mascota</p>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full text-[#9CA3AF] hover:bg-white/5 hover:text-[#F7F7F8] transition flex items-center justify-center"
            >
              <IconoCerrar />
            </button>
          </div>

          <div className="mt-3 flex flex-col items-center gap-3">
            <AvatarVolante
              px={Math.round(88 * ESCALA_TAMANO[config.tamano])}
              personalidad={config.personalidad}
              bailando={bailando}
              onFinBaile={() => setBailando(false)}
            />
            <p className="text-lg font-bold text-[#F7F7F8]">{nombreVisible}</p>
            <button
              type="button"
              onClick={bailar}
              className="h-11 px-7 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold active:scale-95 transition"
            >
              ¡Baila!
            </button>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-[#9CA3AF] mb-2">Nombre</p>
            <div className="flex gap-2 mb-2">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onCambiar({ ...config, nombre: s })}
                  className={`h-9 px-4 rounded-full text-sm font-medium border transition active:scale-95 ${
                    config.nombre === s
                      ? 'bg-[#2563EB] border-transparent text-white'
                      : 'bg-transparent border-white/10 text-[#9CA3AF] hover:text-[#F7F7F8] hover:border-white/25'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              value={config.nombre}
              onChange={(e) => onCambiar({ ...config, nombre: e.target.value })}
              onBlur={() => {
                if (config.nombre.trim().length === 0) onCambiar({ ...config, nombre: 'Volante' });
              }}
              maxLength={24}
              placeholder="Tu nombre"
              aria-label="Nombre de tu mascota"
              autoComplete="off"
              className="w-full h-12 rounded-full bg-[#0A0A0C] border border-white/10 focus:border-[#2563EB]/70 outline-none px-4 text-[16px] text-[#F7F7F8] placeholder:text-[#9CA3AF] transition-colors"
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-[#9CA3AF] mb-2">Personalidad</p>
            <div className="grid grid-cols-3 gap-2">
              {OPCIONES_PERSONALIDAD.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => onCambiar({ ...config, personalidad: o.valor })}
                  className={claseOpcion(config.personalidad === o.valor)}
                >
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-[#9CA3AF] mb-2">Tamaño</p>
            <div className="grid grid-cols-3 gap-2">
              {OPCIONES_TAMANO.map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => onCambiar({ ...config, tamano: o.valor })}
                  className={claseOpcion(config.tamano === o.valor)}
                >
                  {o.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="mt-5 w-full h-12 rounded-full border border-white/15 text-sm font-semibold text-[#F7F7F8] hover:bg-white/5 active:scale-[0.99] transition"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}