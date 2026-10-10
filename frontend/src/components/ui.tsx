import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Loader2, X, type LucideIcon } from 'lucide-react';

// ---------- Botón ----------

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

const ESTILO_BOTON: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-primario-oscuro disabled:bg-slate-300 disabled:text-slate-500',
  secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300 disabled:text-slate-500',
  fantasma: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
};

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  icono?: LucideIcon;
  ancho?: boolean;
  chico?: boolean;
}

export function Boton({ variante = 'primario', cargando, icono: Icono, ancho, chico, children, className = '', disabled, ...resto }: PropsBoton) {
  return (
    <button
      type="button"
      {...resto}
      disabled={disabled || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${
        chico ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      } ${ancho ? 'w-full' : ''} ${ESTILO_BOTON[variante]} ${className}`}
    >
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icono ? <Icono className={chico ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden /> : null}
      {children}
    </button>
  );
}

// ---------- Etiqueta de estado (el color siempre va acompañado de texto) ----------

export type Tono = 'verde' | 'ambar' | 'rojo' | 'gris' | 'azul';

const ESTILO_TONO: Record<Tono, string> = {
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ambar: 'bg-amber-50 text-amber-800 ring-amber-200',
  rojo: 'bg-red-50 text-red-700 ring-red-200',
  gris: 'bg-slate-100 text-slate-600 ring-slate-200',
  azul: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const PUNTO_TONO: Record<Tono, string> = {
  verde: 'bg-emerald-500',
  ambar: 'bg-amber-500',
  rojo: 'bg-red-500',
  gris: 'bg-slate-400',
  azul: 'bg-blue-500',
};

export function Etiqueta({ tono, children, punto, title }: { tono: Tono; children: ReactNode; punto?: boolean; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${ESTILO_TONO[tono]}`}>
      {punto && <span className={`h-1.5 w-1.5 rounded-full ${PUNTO_TONO[tono]}`} aria-hidden />}
      {children}
    </span>
  );
}

// ---------- Campo de formulario con etiqueta visible y error junto al campo ----------

interface PropsCampo {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode;
}

export function Campo({ etiqueta, error, ayuda, opcional, children }: PropsCampo) {
  const id = useId();
  const descripcion = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta} {opcional && <span className="font-normal text-slate-400">(opcional)</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': descripcion })}
      {error ? <MensajeError id={`${id}-error`}>{error}</MensajeError> : ayuda ? <p id={`${id}-ayuda`} className="mt-1.5 text-xs text-slate-500">{ayuda}</p> : null}
    </div>
  );
}

export function MensajeError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

// ---------- Diálogo modal ----------

interface PropsModal {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md';
}

export function Modal({ titulo, onCerrar, children, pie, ancho = 'sm' }: PropsModal) {
  const idTitulo = useId();
  const panel = useRef<HTMLDivElement>(null);
  // La referencia evita que el efecto se repita (y robe el foco) en cada render del padre
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar.current();
    };
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      anterior?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-marino/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`w-full ${ancho === 'sm' ? 'max-w-md' : 'max-w-lg'} rounded-2xl bg-white shadow-xl outline-none`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5">
          <h2 id={idTitulo} className="text-lg font-semibold text-slate-900">
            {titulo}
          </h2>
          <button type="button" onClick={onCerrar} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4 text-sm text-slate-600">{children}</div>
        {pie && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">{pie}</div>}
      </div>
    </div>
  );
}

// ---------- Estados de la interfaz: vacío, carga y error ----------

export function EstadoVacio({ icono: Icono, titulo, texto, accion }: { icono: LucideIcon; titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" data-testid="estado-vacio">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icono className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{texto}</p>
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export function Esqueleto({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} aria-hidden />;
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {texto}
    </div>
  );
}

export function ErrorDeCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <EstadoVacio
      icono={AlertCircle}
      titulo="No pudimos cargar la información"
      texto={mensaje}
      accion={<Boton onClick={onReintentar}>Reintentar</Boton>}
    />
  );
}
