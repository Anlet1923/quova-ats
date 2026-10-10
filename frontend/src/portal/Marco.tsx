import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, type LucideIcon } from 'lucide-react';

/** Ancho del contenido del portal: una columna en celular y hasta 72 rem en computadora. */
const ANCHO = 'mx-auto w-full max-w-lg px-4 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8';

/** Marco del portal público: barra de navegación delgada, contenido y pie, como cualquier página web. */
export function MarcoPortal({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <header className="sticky top-0 z-10 bg-marino text-white shadow-sm">
        <div className={`flex h-20 items-center sm:h-24 ${ANCHO}`}>
          <Link to="/postular" className="flex items-center gap-3 rounded [&]:ring-offset-marino">
            <ShoppingBag className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" strokeWidth={1.75} aria-hidden />
            <span className="leading-tight">
              <span className="block text-xl font-bold sm:text-2xl">Quova</span>
              <span className="block text-xs text-slate-300 sm:text-sm">Trabaja con nosotros</span>
            </span>
          </Link>
        </div>
      </header>
      <main className={`flex-1 py-6 lg:py-10 ${ANCHO}`}>{children}</main>
      <footer className="bg-marino text-slate-300">
        <div className={`flex flex-col gap-1 py-5 text-xs sm:flex-row sm:items-center sm:justify-between ${ANCHO}`}>
          <p className="font-semibold text-white">Quova · Moda &amp; Calzado</p>
          <p>Postula sin crear una cuenta. Tus datos se usan solo para este proceso de selección.</p>
        </div>
      </footer>
    </div>
  );
}

const TONOS = {
  verde: 'bg-emerald-50 text-emerald-600 ring-emerald-50/60',
  ambar: 'bg-amber-50 text-amber-600 ring-amber-50/60',
  rojo: 'bg-red-50 text-red-600 ring-red-50/60',
  gris: 'bg-slate-100 text-slate-500 ring-slate-100/60',
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
    <section className="tarjeta mx-auto max-w-xl px-6 py-10 text-center shadow-md shadow-marino/5 motion-safe:animate-entrada lg:my-8" data-testid={testid}>
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-8 motion-safe:animate-brote ${TONOS[tono]}`}>
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

export const ENLACE_PRIMARIO = 'block w-full rounded-lg bg-primario px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primario-oscuro';
export const ENLACE_SECUNDARIO = 'block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50';
