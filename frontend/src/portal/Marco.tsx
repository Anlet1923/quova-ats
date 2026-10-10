import type { ReactNode } from 'react';
import { ShoppingBag, type LucideIcon } from 'lucide-react';

/** Marco del portal público: móvil primero, una sola columna centrada y sin menú. */
export function MarcoPortal({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo">
      <header className="bg-marino text-white">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold">Quova</p>
            <p className="text-xs text-slate-300">Trabaja con nosotros</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md px-4 py-5">{children}</main>
    </div>
  );
}

const TONOS = {
  verde: 'bg-emerald-50 text-emerald-600',
  ambar: 'bg-amber-50 text-amber-600',
  rojo: 'bg-red-50 text-red-600',
  gris: 'bg-slate-100 text-slate-500',
};

interface PropsPantalla {
  icono: LucideIcon;
  tono: keyof typeof TONOS;
  titulo: string;
  children: ReactNode;
  acciones?: ReactNode;
  testid: string;
}

/** Pantalla propia para cada estado alternativo: explica qué pasó y ofrece una salida. */
export function PantallaEstado({ icono: Icono, tono, titulo, children, acciones, testid }: PropsPantalla) {
  return (
    <section className="tarjeta px-6 py-10 text-center" data-testid={testid}>
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${TONOS[tono]}`}>
        <Icono className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-slate-900">
        {titulo}
      </h1>
      <div className="mt-2 space-y-2 text-sm text-slate-600">{children}</div>
      {acciones && <div className="mt-7 flex flex-col gap-2">{acciones}</div>}
    </section>
  );
}

export const ENLACE_PRIMARIO = 'block w-full rounded-lg bg-primario px-4 py-3 text-center text-sm font-semibold text-white hover:bg-primario-oscuro';
export const ENLACE_SECUNDARIO = 'block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50';
