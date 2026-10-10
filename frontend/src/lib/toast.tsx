import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type Tipo = 'exito' | 'error';

interface Aviso {
  id: number;
  tipo: Tipo;
  mensaje: string;
}

interface Avisos {
  exito: (mensaje: string) => void;
  error: (mensaje: string) => void;
}

const Contexto = createContext<Avisos | null>(null);
const DURACION_MS = 4500;

/** Avisos temporales (toasts) de éxito o error, anunciados a lectores de pantalla. */
export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const siguiente = useRef(1);

  const quitar = useCallback((id: number) => setAvisos((lista) => lista.filter((a) => a.id !== id)), []);

  const mostrar = useCallback(
    (tipo: Tipo, mensaje: string) => {
      const id = siguiente.current++;
      setAvisos((lista) => [...lista.slice(-2), { id, tipo, mensaje }]);
      window.setTimeout(() => quitar(id), DURACION_MS);
    },
    [quitar],
  );

  const valor = useMemo<Avisos>(
    () => ({ exito: (m) => mostrar('exito', m), error: (m) => mostrar('error', m) }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === 'error' ? 'alert' : 'status'}
            data-testid={`aviso-${a.tipo}`}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg ${
              a.tipo === 'exito' ? 'border-emerald-200' : 'border-red-200'
            }`}
          >
            {a.tipo === 'exito' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            )}
            <p className="flex-1 text-slate-800">
              <span className="font-semibold">{a.tipo === 'exito' ? 'Listo. ' : 'Error. '}</span>
              {a.mensaje}
            </p>
            <button
              type="button"
              onClick={() => quitar(a.id)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-700"
              aria-label="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useAvisos(): Avisos {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAvisos debe usarse dentro de ProveedorAvisos');
  return contexto;
}
