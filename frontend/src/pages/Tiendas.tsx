import { Briefcase, MapPin, Minus, Pencil, Plus, Store } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { TIENDAS } from '../lib/demo';
import { iniciales, type Rol } from '../lib/tipos';
import { Boton, Etiqueta } from '../components/ui';
import { DatosDeMuestra, useAccionPendiente } from '../components/modulo';

/** Solo el administrador crea, edita, activa y desactiva tiendas; los demás roles consultan (Tabla 5 del informe). */
const PUEDE_ADMINISTRAR: Rol[] = ['ADMIN'];
const AVATAR = ['bg-violet-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-amber-600', 'bg-blue-600'];
const BOTON_PIE = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-slate-50';

export default function Tiendas() {
  const { tieneRol } = useAuth();
  const { pedir, dialogo } = useAccionPendiente();
  const administra = tieneRol(PUEDE_ADMINISTRAR);
  const activas = TIENDAS.filter((t) => t.activa).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-sans text-base font-medium text-slate-600">
          {activas} tiendas activas · {TIENDAS.length} en total
        </h2>
        <DatosDeMuestra />
        {administra && (
          <Boton icono={Plus} className="ml-auto" onClick={() => pedir('Nueva tienda')}>
            Nueva tienda
          </Boton>
        )}
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="lista-tiendas">
        {TIENDAS.map((t, i) => (
          <li key={t.nombre} className="tarjeta flex flex-col transition duration-200 hover:border-primario/40 hover:shadow-md">
            <div className="flex items-center gap-3 border-b border-slate-100 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primario-suave text-primario">
                <Store className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <h3 className="text-base font-semibold text-slate-900">{t.nombre}</h3>
                <p className="text-xs text-slate-500">Tienda {t.nombre}</p>
              </div>
              <Etiqueta tono={t.activa ? 'verde' : 'gris'}>{t.activa ? 'Activa' : 'Inactiva'}</Etiqueta>
            </div>

            <div className="flex-1 space-y-3 p-4 text-sm">
              <p className="flex items-start gap-2 text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {t.direccion}
              </p>
              <div className="flex items-center gap-2">
                {t.jefe ? (
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${AVATAR[i % AVATAR.length]}`} aria-hidden>
                    {iniciales(t.jefe)}
                  </span>
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500" aria-hidden>
                    <Minus className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className={`flex-1 ${t.jefe ? 'text-slate-800' : 'text-slate-500'}`}>{t.jefe ?? '(Sin asignar)'}</span>
                <Etiqueta tono="azul">Jefe de tienda</Etiqueta>
              </div>
              <p className="flex items-center gap-2 border-t border-slate-100 pt-3 text-slate-600">
                <Briefcase className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                <span className="flex-1">Vacantes abiertas</span>
                <span className="font-titulo text-base font-semibold tabular-nums text-slate-900">{t.vacantes}</span>
              </p>
            </div>

            {administra && (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                <button type="button" className={`${BOTON_PIE} text-slate-700`} onClick={() => pedir(`Editar tienda ${t.nombre}`)} aria-label={`Editar tienda ${t.nombre}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                </button>
                {/* La acción destructiva se distingue en rojo de «Editar» */}
                <button
                  type="button"
                  className={`${BOTON_PIE} ${t.activa ? 'text-red-600' : 'text-emerald-700'}`}
                  onClick={() => pedir(`${t.activa ? 'Desactivar' : 'Activar'} tienda ${t.nombre}`)}
                  aria-label={`${t.activa ? 'Desactivar' : 'Activar'} tienda ${t.nombre}`}
                >
                  {t.activa ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {dialogo}
    </div>
  );
}
