import { useEffect, useRef, useState } from 'react';
import { calcularRetenciones, compararEsquemas } from '../lib/calculos';
import { ISR_SIN_RFC, IVA_SIN_RFC } from '../lib/tasas';
import { extraerMonto, parsearMensaje } from '../lib/chat-parser';
import {
  AvatarVolante,
  ESCALA_TAMANO,
  PanelMascota,
  guardarConfigMascota,
  leerConfigMascota,
} from './MascotaVolante';
import type { ConfigMascota, Personalidad } from './MascotaVolante';

const FORMATO_MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const fmt = (n: number): string => FORMATO_MXN.format(n);
const fmtTiempo = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

let secuencia = 0;
const nuevoId = (): string => `m${Date.now()}-${++secuencia}`;

interface Datos {
  conRFC: boolean;
  ultimoIngreso: number | null;
  ultimaGasolina: number | null;
}

const DATOS_DEFECTO: Datos = { conRFC: true, ultimoIngreso: null, ultimaGasolina: null };
const CLAVE_DATOS = 'mivolante:datos';

function leerDatos(): Datos {
  try {
    const raw = localStorage.getItem(CLAVE_DATOS);
    if (raw) {
      const j: unknown = JSON.parse(raw);
      if (typeof j === 'object' && j !== null) {
        const o = j as Record<string, unknown>;
        return {
          conRFC: typeof o.conRFC === 'boolean' ? o.conRFC : true,
          ultimoIngreso: typeof o.ultimoIngreso === 'number' ? o.ultimoIngreso : null,
          ultimaGasolina: typeof o.ultimaGasolina === 'number' ? o.ultimaGasolina : null,
        };
      }
    }
  } catch {
    // Almacenamiento no disponible.
  }
  return { ...DATOS_DEFECTO };
}

function guardarDatos(d: Datos): void {
  try {
    localStorage.setItem(CLAVE_DATOS, JSON.stringify(d));
  } catch {
    // Sin espacio o modo privado.
  }
}

type Accion = 'desglose' | 'comparacion' | 'comparar' | 'registroRFC' | 'rfcSi';
type Pendiente = 'ingreso' | 'gasolina' | 'adjunto' | null;

interface BotonMensaje {
  texto: string;
  accion: Accion;
}

interface Tarjeta {
  etiqueta: string;
  valor: string;
  linea?: string;
  boton?: BotonMensaje;
}

interface Mensaje {
  id: string;
  autor: 'usuario' | 'asistente';
  texto?: string;
  tarjeta?: Tarjeta;
  boton?: BotonMensaje;
  fotoUrl?: string;
  audio?: { url: string; segundos: number };
}

const CHIPS = ['¿Cuánto me retienen?', '¿Definitivo o provisional?', 'Anotar gasolina'];

function msgTexto(texto: string): Mensaje {
  return { id: nuevoId(), autor: 'asistente', texto };
}

function msgTarjeta(tarjeta: Tarjeta): Mensaje {
  return { id: nuevoId(), autor: 'asistente', tarjeta };
}

function tienePalabraIngreso(texto: string): boolean {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (
    /\b(?:gane|ingreso|ingresos|cobre|facture)\b/.test(t) ||
    /\bme\s+(?:pagaron|depositaron)\b/.test(t)
  );
}

function tarjetaIngreso(ingreso: number, d: Datos, explicitoRFC: boolean): Mensaje {
  const c = calcularRetenciones({ ingresoConIVA: ingreso, conRFC: d.conRFC });
  const retenido = c.isr + c.iva;
  const pct = Math.round((ISR_SIN_RFC + IVA_SIN_RFC) * 100);
  if (d.conRFC) {
    return msgTarjeta({
      etiqueta: explicitoRFC ? 'Con RFC te depositan' : 'Te depositan',
      valor: fmt(c.deposito),
      linea: `Te retuvieron ${fmt(retenido)}`,
      boton: { texto: 'Ver el desglose', accion: 'desglose' },
    });
  }
  return msgTarjeta({
    etiqueta: explicitoRFC ? 'Sin RFC te depositan' : 'Te depositan',
    valor: fmt(c.deposito),
    linea: explicitoRFC ? `Te quitan el ${pct}%` : `Sin RFC te quitan el ${pct}%`,
    boton: { texto: '¿Cómo registro mi RFC?', accion: 'registroRFC' },
  });
}

function IconoMas() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconoEnviar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function IconoCamara() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h3.2L9 4.5h6L16.8 7H20v12H4V7z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

function IconoMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function IconoStop() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  );
}

function IconoPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function IconoPausa() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}

function IconoX() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

let audioActivo: HTMLAudioElement | null = null;

function ReproductorAudio({ url, segundos }: { url: string; segundos: number }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      const a = ref.current;
      if (a) {
        a.onplay = null;
        a.onpause = null;
        a.onended = null;
        a.ontimeupdate = null;
        a.pause();
        if (audioActivo === a) audioActivo = null;
      }
    };
  }, []);

  const alternar = () => {
    if (!ref.current) {
      const audio = new Audio(url);
      audio.onplay = () => setReproduciendo(true);
      audio.onpause = () => setReproduciendo(false);
      audio.onended = () => {
        setReproduciendo(false);
        setProgreso(0);
      };
      audio.ontimeupdate = () => {
        const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : segundos;
        setProgreso(Math.min(1, audio.currentTime / dur));
      };
      ref.current = audio;
    }
    const a = ref.current;
    if (a.paused) {
      if (audioActivo && audioActivo !== a) audioActivo.pause();
      audioActivo = a;
      void a.play().catch(() => setReproduciendo(false));
    } else {
      a.pause();
    }
  };

  return (
    <div className="flex items-center gap-2.5 w-[210px] max-w-full">
      <button
        type="button"
        onClick={alternar}
        aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
        className="w-9 h-9 shrink-0 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition flex items-center justify-center text-white"
      >
        {reproduciendo ? <IconoPausa /> : <IconoPlay />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-[width] duration-150"
            style={{ width: `${Math.min(100, progreso * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-white/80 tabular-nums">{fmtTiempo(segundos)}</p>
      </div>
    </div>
  );
}

function TarjetaRespuesta({ t, alAccion }: { t: Tarjeta; alAccion: (a: Accion) => void }) {
  const boton = t.boton;
  return (
    <div className="rounded-2xl rounded-bl-md bg-[#12121A] border border-white/10 p-4">
      <p className="text-xs font-medium text-[#9CA3AF]">{t.etiqueta}</p>
      <p className="mt-1 text-[30px] leading-none font-bold tracking-tight text-[#F7F7F8] tabular-nums break-words">
        {t.valor}
      </p>
      {t.linea && <p className="mt-1.5 text-[13px] text-[#9CA3AF]">{t.linea}</p>}
      {boton && (
        <button
          type="button"
          onClick={() => alAccion(boton.accion)}
          className="mt-3 w-full h-11 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] transition text-white text-sm font-semibold"
        >
          {boton.texto}
        </button>
      )}
    </div>
  );
}

interface PropsBurbuja {
  m: Mensaje;
  px: number;
  personalidad: Personalidad;
  alAvatar: () => void;
  alAccion: (a: Accion) => void;
}

function Burbuja({ m, px, personalidad, alAvatar, alAccion }: PropsBurbuja) {
  if (m.autor === 'usuario') {
    return (
      <div className="mv-msg self-end max-w-[85%]">
        {m.fotoUrl ? (
          <div className="rounded-2xl rounded-br-md overflow-hidden border border-[#2563EB]/40 bg-[#12121A] p-1">
            <img src={m.fotoUrl} alt="Foto enviada" className="block rounded-xl max-h-60 max-w-full" />
          </div>
        ) : m.audio ? (
          <div className="rounded-2xl rounded-br-md bg-[#2563EB] px-3 py-2.5">
            <ReproductorAudio url={m.audio.url} segundos={m.audio.segundos} />
          </div>
        ) : (
          <div className="rounded-2xl rounded-br-md bg-[#2563EB] px-3.5 py-2.5 text-[15px] leading-snug text-white whitespace-pre-line break-words">
            {m.texto}
          </div>
        )}
      </div>
    );
  }
  const boton = m.boton;
  return (
    <div className="mv-msg self-start max-w-[92%] flex items-end gap-2">
      <AvatarVolante px={px} personalidad={personalidad} onClick={alAvatar} etiqueta="Tu mascota" />
      <div className="min-w-0 flex-1">
        {m.tarjeta ? (
          <TarjetaRespuesta t={m.tarjeta} alAccion={alAccion} />
        ) : (
          <div className="rounded-2xl rounded-bl-md bg-[#12121A] border border-white/10 px-3.5 py-2.5 text-[15px] leading-snug text-[#F7F7F8] whitespace-pre-line break-words">
            {m.texto}
            {boton && (
              <button
                type="button"
                onClick={() => alAccion(boton.accion)}
                className="mt-2 h-10 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 transition text-white text-sm font-semibold"
              >
                {boton.texto}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Escribiendo({ px, personalidad }: { px: number; personalidad: Personalidad }) {
  return (
    <div className="mv-msg self-start flex items-end gap-2" aria-label="Escribiendo">
      <AvatarVolante px={px} personalidad={personalidad} />
      <div className="rounded-2xl rounded-bl-md bg-[#12121A] border border-white/10 px-4 py-3 flex items-center gap-1">
        <span className="mv-punto w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
        <span className="mv-punto w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
        <span className="mv-punto w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
      </div>
    </div>
  );
}

function BarraGrabacion({
  segundos,
  alParar,
  alCancelar,
}: {
  segundos: number;
  alParar: () => void;
  alCancelar: () => void;
}) {
  return (
    <div className="flex items-center gap-3 h-12 rounded-full bg-[#12121A] border border-[#2563EB]/50 px-2">
      <button
        type="button"
        onClick={alCancelar}
        aria-label="Cancelar"
        className="w-9 h-9 shrink-0 rounded-full text-[#9CA3AF] hover:bg-white/5 hover:text-[#F7F7F8] transition flex items-center justify-center"
      >
        <IconoX />
      </button>
      <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-[#2563EB] mv-rec" />
      <span className="text-[15px] text-[#F7F7F8] tabular-nums flex-1">{fmtTiempo(segundos)}</span>
      <span className="text-xs text-[#9CA3AF]">Grabando</span>
      <button
        type="button"
        onClick={alParar}
        aria-label="Detener"
        className="w-10 h-10 shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white active:scale-95 transition flex items-center justify-center"
      >
        <IconoStop />
      </button>
    </div>
  );
}

function MenuAdjuntos({
  alFoto,
  alVoz,
  alCerrar,
}: {
  alFoto: () => void;
  alVoz: () => void;
  alCerrar: () => void;
}) {
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar();
    };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [alCerrar]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Adjuntar">
      <button type="button" aria-label="Cerrar" onClick={alCerrar} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div
        className="relative w-full sm:max-w-md bg-[#12121A] border border-white/10 rounded-t-3xl mv-vista p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-3" />
        <p className="text-xs font-semibold text-[#9CA3AF] px-3 mb-1">Adjuntar</p>
        <button
          type="button"
          onClick={alFoto}
          className="w-full h-14 flex items-center gap-3 rounded-full px-3 hover:bg-white/5 active:scale-[0.99] transition"
        >
          <span className="w-10 h-10 rounded-full bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center">
            <IconoCamara />
          </span>
          <span className="text-[15px] font-medium text-[#F7F7F8]">Foto</span>
        </button>
        <button
          type="button"
          onClick={alVoz}
          className="w-full h-14 flex items-center gap-3 rounded-full px-3 hover:bg-white/5 active:scale-[0.99] transition"
        >
          <span className="w-10 h-10 rounded-full bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center">
            <IconoMic />
          </span>
          <span className="text-[15px] font-medium text-[#F7F7F8]">Nota de voz</span>
        </button>
      </div>
    </div>
  );
}

interface PropsChat {
  onVerDesglose: () => void;
  onVerComparacion: () => void;
}

export default function ChatMiVolante({ onVerDesglose, onVerComparacion }: PropsChat) {
  const [config, setConfig] = useState<ConfigMascota>(() => leerConfigMascota());
  const [datosIniciales] = useState<Datos>(() => leerDatos());
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [escribiendo, setEscribiendo] = useState(0);
  const [borrador, setBorrador] = useState('');
  const [pendiente, setPendiente] = useState<Pendiente>(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [menuAdjunto, setMenuAdjunto] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const datosRef = useRef<Datos>(datosIniciales);
  const pendienteRef = useRef<Pendiente>(null);
  const objetivoRef = useRef<'comparador' | null>(null);
  const mensajesRef = useRef<Mensaje[]>([]);
  const timersRef = useRef<number[]>([]);
  const urlsRef = useRef<Set<string>>(new Set());
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervaloRef = useRef<number | null>(null);
  const canceladoRef = useRef(false);
  const segundosRef = useRef(0);
  const finRef = useRef<HTMLDivElement | null>(null);
  const archivoRef = useRef<HTMLInputElement | null>(null);

  const agregar = (m: Mensaje) => {
    mensajesRef.current = [...mensajesRef.current, m];
    setMensajes(mensajesRef.current);
  };

  const fijarPendiente = (p: Pendiente) => {
    pendienteRef.current = p;
    setPendiente(p);
  };

  const fijarObjetivo = (o: 'comparador' | null) => {
    objetivoRef.current = o;
  };

  const actualizarDatos = (d: Datos) => {
    datosRef.current = d;
    guardarDatos(d);
  };

  const responder = (m: Mensaje) => {
    setEscribiendo((c) => c + 1);
    const t = window.setTimeout(() => {
      agregar(m);
      setEscribiendo((c) => Math.max(0, c - 1));
    }, 650);
    timersRef.current.push(t);
  };

  const pasoComparador = (d: Datos): Mensaje => {
    if (d.ultimoIngreso === null) {
      fijarPendiente('ingreso');
      return msgTexto('¿Cuánto ganaste este mes?');
    }
    if (d.ultimaGasolina === null) {
      fijarPendiente('gasolina');
      return msgTexto('¿Cuánto fue de gasolina?');
    }
    fijarObjetivo(null);
    const r = compararEsquemas({
      ingresoConIVA: d.ultimoIngreso,
      gasolinaConIVA: d.ultimaGasolina,
      gasolinaConCFDI: true,
    });
    const ver: BotonMensaje = { texto: 'Ver la comparación', accion: 'comparacion' };
    if (!r.definitivoDisponible) {
      return msgTarjeta({
        etiqueta: 'Te toca pagar',
        valor: fmt(r.provisional.totalPorPagar),
        linea: 'Solo provisional aplica',
        boton: ver,
      });
    }
    const diferencia = r.definitivo.total - r.provisional.totalPorPagar;
    if (diferencia > 0.005) {
      return msgTarjeta({ etiqueta: 'El provisional te ahorra', valor: fmt(diferencia), linea: 'al mes', boton: ver });
    }
    if (diferencia < -0.005) {
      return msgTarjeta({ etiqueta: 'El definitivo te ahorra', valor: fmt(-diferencia), linea: 'al mes', boton: ver });
    }
    return msgTarjeta({ etiqueta: 'Pagas lo mismo', valor: fmt(r.definitivo.total), linea: 'al mes', boton: ver });
  };

  const aplicarMonto = (tipo: 'ingreso' | 'gasolina', monto: number, d: Datos): Mensaje => {
    if (tipo === 'ingreso') {
      d.ultimoIngreso = monto;
      actualizarDatos(d);
      if (objetivoRef.current === 'comparador') return pasoComparador(d);
      return tarjetaIngreso(monto, d, false);
    }
    d.ultimaGasolina = monto;
    actualizarDatos(d);
    if (objetivoRef.current === 'comparador') return pasoComparador(d);
    if (d.ultimoIngreso === null) {
      fijarObjetivo('comparador');
      fijarPendiente('ingreso');
      return msgTexto('Guardado.\n¿Cuánto ganaste este mes?');
    }
    return msgTarjeta({
      etiqueta: 'Gasolina anotada',
      valor: fmt(monto),
      linea: 'Lista para comparar',
      boton: { texto: 'Comparar esquemas', accion: 'comparar' },
    });
  };

  const procesar = (texto: string): Mensaje => {
    const r = parsearMensaje(texto);
    const d: Datos = { ...datosRef.current };
    if (typeof r.conRFC === 'boolean') d.conRFC = r.conRFC;
    const p = pendienteRef.current;
    let monto: number | null = r.monto ?? null;
    if (p !== null && monto === null) monto = extraerMonto(texto);

    if (
      p !== null &&
      monto !== null &&
      (r.intencion === 'ingreso' || r.intencion === 'gasolina' || r.intencion === 'ayuda')
    ) {
      fijarPendiente(null);
      const tipo: 'ingreso' | 'gasolina' =
        r.intencion === 'gasolina'
          ? 'gasolina'
          : r.intencion === 'ingreso' && tienePalabraIngreso(texto)
            ? 'ingreso'
            : p === 'gasolina'
              ? 'gasolina'
              : 'ingreso';
      return aplicarMonto(tipo, monto, d);
    }

    fijarPendiente(null);
    switch (r.intencion) {
      case 'registroRFC':
        return {
          ...msgTexto('En la app de tu plataforma, en Datos fiscales.'),
          boton: { texto: 'Ya lo registré', accion: 'rfcSi' },
        };
      case 'rfc': {
        actualizarDatos(d);
        if (d.ultimoIngreso !== null) return tarjetaIngreso(d.ultimoIngreso, d, true);
        fijarPendiente('ingreso');
        return msgTexto(
          d.conRFC ? 'Listo, con RFC.\n¿Cuánto ganaste este mes?' : 'Listo, sin RFC.\n¿Cuánto ganaste este mes?',
        );
      }
      case 'retenciones': {
        if (monto !== null) d.ultimoIngreso = monto;
        actualizarDatos(d);
        if (d.ultimoIngreso === null) {
          fijarPendiente('ingreso');
          return msgTexto('¿Cuánto ganaste este mes?');
        }
        return tarjetaIngreso(d.ultimoIngreso, d, false);
      }
      case 'comparador': {
        if (monto !== null) d.ultimoIngreso = monto;
        actualizarDatos(d);
        fijarObjetivo('comparador');
        return pasoComparador(d);
      }
      case 'gasolina': {
        actualizarDatos(d);
        if (monto === null) {
          fijarPendiente('gasolina');
          return msgTexto('¿Cuánto fue de gasolina?');
        }
        return aplicarMonto('gasolina', monto, d);
      }
      case 'ingreso': {
        actualizarDatos(d);
        if (monto === null) {
          fijarPendiente('ingreso');
          return msgTexto('¿Cuánto ganaste este mes?');
        }
        return aplicarMonto('ingreso', monto, d);
      }
      default: {
        actualizarDatos(d);
        if (p !== null) {
          fijarPendiente(p);
          return msgTexto('Dime solo la cantidad.');
        }
        return msgTexto('Escribe: Gané 15000.\nO toca un botón de abajo.');
      }
    }
  };

  const enviar = (textoBruto: string) => {
    const texto = textoBruto.trim();
    if (texto.length === 0) return;
    agregar({ id: nuevoId(), autor: 'usuario', texto });
    setBorrador('');
    responder(procesar(texto));
  };

  const alAccion = (accion: Accion) => {
    if (accion === 'desglose') onVerDesglose();
    else if (accion === 'comparacion') onVerComparacion();
    else if (accion === 'comparar') enviar('¿Definitivo o provisional?');
    else if (accion === 'registroRFC') enviar('¿Cómo registro mi RFC?');
    else enviar('Tengo RFC');
  };

  const recibirFoto = (f: File) => {
    if (!f.type.startsWith('image/')) {
      responder(msgTexto('Elige una imagen.'));
      return;
    }
    const url = URL.createObjectURL(f);
    urlsRef.current.add(url);
    agregar({ id: nuevoId(), autor: 'usuario', fotoUrl: url });
    fijarPendiente('adjunto');
    responder(msgTexto('¿Cuánto fue?'));
  };

  const detenerVoz = () => {
    const r = recorderRef.current;
    if (r && r.state !== 'inactive') r.stop();
  };

  const cancelarVoz = () => {
    canceladoRef.current = true;
    detenerVoz();
  };

  const iniciarVoz = async () => {
    setMenuAdjunto(false);
    if (grabando) return;
    if (
      typeof navigator.mediaDevices?.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      responder(msgTexto('Tu navegador no permite grabar.'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      canceladoRef.current = false;
      segundosRef.current = 0;
      setSegundos(0);
      rec.ondataavailable = (ev: BlobEvent) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onerror = () => {
        canceladoRef.current = true;
        detenerVoz();
        responder(msgTexto('No se grabó audio.'));
      };
      rec.onstop = () => {
        if (intervaloRef.current !== null) {
          window.clearInterval(intervaloRef.current);
          intervaloRef.current = null;
        }
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        const secs = Math.max(1, segundosRef.current);
        setGrabando(false);
        if (canceladoRef.current) return;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size === 0) {
          responder(msgTexto('No se grabó audio.'));
          return;
        }
        const url = URL.createObjectURL(blob);
        urlsRef.current.add(url);
        agregar({ id: nuevoId(), autor: 'usuario', audio: { url, segundos: secs } });
        fijarPendiente('adjunto');
        responder(msgTexto('¿Cuánto fue?'));
      };
      rec.start(250);
      setGrabando(true);
      intervaloRef.current = window.setInterval(() => {
        segundosRef.current += 1;
        setSegundos(segundosRef.current);
        if (segundosRef.current >= 60) detenerVoz();
      }, 1000);
    } catch {
      responder(msgTexto('No pude usar el micrófono.\nRevisa el permiso.'));
    }
  };

  const cambiarConfig = (c: ConfigMascota) => {
    setConfig(c);
    guardarConfigMascota(c);
  };

  useEffect(() => {
    if (mensajesRef.current.length > 0) return;
    const nombre = config.nombre.trim() || 'Volante';
    const saludo =
      config.personalidad === 'tranquilo'
        ? `Hola, soy ${nombre}. Dime cuánto ganaste.`
        : config.personalidad === 'motivador'
          ? `¡Hola, soy ${nombre}! ¿Cuánto ganaste este mes?`
          : `Hola, soy ${nombre}. ¿Cuánto ganaste este mes?`;
    agregar({ id: nuevoId(), autor: 'asistente', texto: saludo });
    // Solo al montar: saludo inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fin = finRef.current;
    if (!fin) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fin.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [mensajes, escribiendo]);

  useEffect(() => {
    const timers = timersRef.current;
    const urls = urlsRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      if (intervaloRef.current !== null) window.clearInterval(intervaloRef.current);
      canceladoRef.current = true;
      const rec = recorderRef.current;
      if (rec && rec.state !== 'inactive') rec.stop();
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const escala = ESCALA_TAMANO[config.tamano];
  const pxEncabezado = Math.round(40 * escala);
  const pxBurbuja = Math.round(32 * escala);
  const nombreVisible = config.nombre.trim() || 'Volante';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5">
        <AvatarVolante
          px={pxEncabezado}
          personalidad={config.personalidad}
          onClick={() => setPanelAbierto(true)}
          etiqueta="Abrir panel de tu mascota"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-[#F7F7F8] truncate">{nombreVisible}</p>
          <p className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mv-pulso" />
            En línea
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto mv-scroll px-3 pb-2" role="log" aria-live="polite">
        <div className="max-w-md mx-auto flex flex-col gap-2.5 pt-1">
          <p className="text-center text-[11px] text-[#9CA3AF] py-1">Hoy</p>
          {mensajes.map((m) => (
            <Burbuja
              key={m.id}
              m={m}
              px={pxBurbuja}
              personalidad={config.personalidad}
              alAvatar={() => setPanelAbierto(true)}
              alAccion={alAccion}
            />
          ))}
          {escribiendo > 0 && <Escribiendo px={pxBurbuja} personalidad={config.personalidad} />}
          <div ref={finRef} />
        </div>
      </div>

      {!grabando && (
        <div className="shrink-0 mv-chips overflow-x-auto px-3 pb-1.5">
          <div className="flex gap-2 w-max mx-auto">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => enviar(c)}
                className="shrink-0 whitespace-nowrap h-9 px-3.5 rounded-full bg-[#12121A] border border-white/10 hover:border-[#2563EB]/60 text-[13px] text-[#F7F7F8] active:scale-95 transition"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 px-3 pb-2 pt-1">
        <div className="max-w-md mx-auto">
          {grabando ? (
            <BarraGrabacion segundos={segundos} alParar={detenerVoz} alCancelar={cancelarVoz} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar(borrador);
              }}
              className="flex items-center gap-1 h-12 rounded-full bg-[#12121A] border border-white/10 focus-within:border-[#2563EB]/60 px-1 transition-colors"
            >
              <button
                type="button"
                aria-label="Adjuntar"
                onClick={() => setMenuAdjunto(true)}
                className="w-10 h-10 shrink-0 rounded-full text-[#9CA3AF] hover:text-[#F7F7F8] hover:bg-white/5 active:scale-95 transition flex items-center justify-center"
              >
                <IconoMas />
              </button>
              <input
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                inputMode={pendiente !== null ? 'decimal' : 'text'}
                enterKeyHint="send"
                placeholder={pendiente === 'gasolina' ? 'Ej. 3500' : 'Ej. Gané 15000'}
                aria-label="Mensaje"
                autoComplete="off"
                className="flex-1 min-w-0 bg-transparent text-[16px] text-[#F7F7F8] placeholder:text-[#9CA3AF] outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={borrador.trim().length === 0}
                className="w-10 h-10 shrink-0 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:bg-white/10 disabled:text-[#9CA3AF] active:scale-95 transition flex items-center justify-center"
              >
                <IconoEnviar />
              </button>
            </form>
          )}
        </div>
      </div>

      <input
        ref={archivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (f) recibirFoto(f);
        }}
      />

      {menuAdjunto && (
        <MenuAdjuntos
          alFoto={() => {
            setMenuAdjunto(false);
            archivoRef.current?.click();
          }}
          alVoz={() => {
            void iniciarVoz();
          }}
          alCerrar={() => setMenuAdjunto(false)}
        />
      )}

      {panelAbierto && (
        <PanelMascota config={config} onCambiar={cambiarConfig} onCerrar={() => setPanelAbierto(false)} />
      )}
    </div>
  );
}