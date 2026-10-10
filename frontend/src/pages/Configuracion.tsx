import { useState } from 'react';
import { Briefcase, CreditCard, Home, Mail, MessageCircle, Package, Pencil, Plus, ShieldCheck, ShoppingBag, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { CARGOS_DEMO, PLANTILLAS_DEMO, USUARIOS_DEMO } from '../lib/demo';
import { ETIQUETA_ROL, iniciales, soles, type Rol } from '../lib/tipos';
import { Boton, Etiqueta, type Tono } from '../components/ui';
import { DatosDeMuestra, useAccionPendiente } from '../components/modulo';
import { SinAcceso } from './Avisos';

const ROLES: Rol[] = ['ADMIN'];
const TONO_ROL: Record<Rol, Tono> = { ADMIN: 'rojo', GERENTE_REGIONAL: 'verde', JEFE_TIENDA: 'ambar', RECLUTADOR: 'azul' };
const AVATAR = ['bg-violet-600', 'bg-cyan-600', 'bg-amber-600', 'bg-blue-600', 'bg-slate-400'];

/** Resumen de lo que puede hacer cada rol, según la tabla de permisos del informe. */
const PERMISOS: { rol: Rol; texto: string }[] = [
  { rol: 'ADMIN', texto: 'Acceso completo: usuarios, roles, cargos, plantillas y tiendas.' },
  { rol: 'RECLUTADOR', texto: 'Crea y publica vacantes, mueve candidatos y agenda entrevistas.' },
  { rol: 'JEFE_TIENDA', texto: 'Consulta su tienda y registra el resultado de sus entrevistas.' },
  { rol: 'GERENTE_REGIONAL', texto: 'Consulta los indicadores y procesos de toda la cadena.' },
];

const ICONO_CARGO: Record<string, LucideIcon> = { 'Vendedor/a': ShoppingBag, 'Cajero/a': CreditCard, 'Encargado de local': Home, 'Personal de almacén': Package };

const PESTANAS = [
  { nombre: 'Usuarios y roles', icono: Users, total: USUARIOS_DEMO.length, accion: 'Invitar usuario' },
  { nombre: 'Cargos', icono: Briefcase, total: CARGOS_DEMO.length, accion: 'Nuevo cargo' },
  { nombre: 'Plantillas', icono: MessageCircle, total: PLANTILLAS_DEMO.length, accion: 'Nueva plantilla' },
] as const;
type Pestana = (typeof PESTANAS)[number]['nombre'];

/** Resalta las variables {entre llaves} de una plantilla de mensaje. */
function Mensaje({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\{[^}]+\})/).map((parte, i) =>
        parte.startsWith('{') ? (
          <span key={i} className="rounded bg-primario-suave px-1 font-medium text-primario">
            {parte}
          </span>
        ) : (
          parte
        ),
      )}
    </>
  );
}

export default function Configuracion() {
  const { tieneRol } = useAuth();
  const { pedir, dialogo } = useAccionPendiente();
  const [pestana, setPestana] = useState<Pestana>('Usuarios y roles');

  if (!tieneRol(ROLES)) return <SinAcceso />;

  const actual = PESTANAS.find((p) => p.nombre === pestana)!;
  const activos = USUARIOS_DEMO.filter((u) => u.activo).length;

  return (
    <div>
      <h2 className="sr-only">Configuración del sistema</h2>

      <div className="flex flex-wrap items-center gap-3">
        <div className="tarjeta flex flex-wrap gap-1 p-1" role="tablist" aria-label="Secciones de configuración">
          {PESTANAS.map((p) => {
            const elegida = pestana === p.nombre;
            return (
              <button
                key={p.nombre}
                type="button"
                role="tab"
                aria-selected={elegida}
                onClick={() => setPestana(p.nombre)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  elegida ? 'bg-primario text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <p.icono className="h-4 w-4" aria-hidden />
                {p.nombre}
                <span className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${elegida ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{p.total}</span>
              </button>
            );
          })}
        </div>
        <DatosDeMuestra />
        <Boton icono={Plus} className="ml-auto" onClick={() => pedir(actual.accion)}>
          {actual.accion}
        </Boton>
      </div>

      <div className="mt-4 motion-safe:animate-entrada" key={pestana} role="tabpanel" aria-label={pestana}>
        {pestana === 'Usuarios y roles' && (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="tarjeta overflow-hidden" aria-label="Usuarios del panel">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-900">{activos} usuarios activos</h3>
                <p className="text-xs text-slate-500">{USUARIOS_DEMO.length} personas con acceso al panel</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Nombre</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Rol</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Tienda</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Estado</th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {USUARIOS_DEMO.map((u, i) => (
                      <tr key={u.correo} className={`hover:bg-slate-50/60 ${u.activo ? '' : 'opacity-70'}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR[i % AVATAR.length]}`} aria-hidden>
                              {iniciales(u.nombre)}
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="font-semibold text-slate-900">{u.nombre}</p>
                              <p className="truncate text-xs text-slate-500">{u.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Etiqueta tono={TONO_ROL[u.rol]}>{ETIQUETA_ROL[u.rol]}</Etiqueta>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">{u.tienda ?? 'Toda la cadena'}</td>
                        <td className="px-5 py-3.5">
                          <Etiqueta tono={u.activo ? 'verde' : 'gris'} punto>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </Etiqueta>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Boton variante="secundario" chico icono={Pencil} onClick={() => pedir(`Editar a ${u.nombre}`)} aria-label={`Editar a ${u.nombre}`}>
                            Editar
                          </Boton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="tarjeta p-5" aria-label="Roles y permisos">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <ShieldCheck className="h-5 w-5 text-primario" aria-hidden /> Roles y permisos
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Qué puede hacer cada rol en el panel</p>
              <ul className="mt-4 space-y-3">
                {PERMISOS.map(({ rol, texto }) => {
                  const total = USUARIOS_DEMO.filter((u) => u.rol === rol).length;
                  return (
                    <li key={rol} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Etiqueta tono={TONO_ROL[rol]}>{ETIQUETA_ROL[rol]}</Etiqueta>
                        <span className="text-xs font-medium text-slate-500">
                          {total} {total === 1 ? 'usuario' : 'usuarios'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{texto}</p>
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        )}

        {pestana === 'Cargos' && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARGOS_DEMO.map((c) => {
              const Icono = ICONO_CARGO[c.nombre] ?? Briefcase;
              return (
                <li key={c.nombre} className="tarjeta flex flex-col p-5 transition duration-200 hover:border-primario/40 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primario-suave text-primario">
                    <Icono className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{c.nombre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.descripcion}</p>
                  <dl className="mt-auto grid grid-cols-2 gap-3 pt-5">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Salario base</dt>
                      <dd className="mt-0.5 font-titulo text-lg font-semibold tabular-nums text-slate-900">{soles(c.salario)}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Vacantes</dt>
                      <dd className="mt-0.5 font-titulo text-lg font-semibold tabular-nums text-slate-900">{c.vacantes}</dd>
                    </div>
                  </dl>
                  <Boton variante="secundario" chico icono={Pencil} className="mt-4 self-start" onClick={() => pedir(`Editar cargo ${c.nombre}`)} aria-label={`Editar cargo ${c.nombre}`}>
                    Editar plantilla
                  </Boton>
                </li>
              );
            })}
          </ul>
        )}

        {pestana === 'Plantillas' && (
          <ul className="grid gap-4 lg:grid-cols-2">
            {PLANTILLAS_DEMO.map((p) => {
              const Icono = p.canal === 'Correo' ? Mail : MessageCircle;
              return (
                <li key={p.nombre} className="tarjeta flex flex-col p-5 transition duration-200 hover:border-primario/40 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primario-suave text-primario">
                      <Icono className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-900">{p.nombre}</h3>
                      <p className="text-xs text-slate-500">Se envía: {p.momento.charAt(0).toLowerCase() + p.momento.slice(1)}</p>
                    </div>
                    <Etiqueta tono="azul">{p.canal}</Etiqueta>
                  </div>
                  <p className="mt-4 flex-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                    <Mensaje texto={p.mensaje} />
                  </p>
                  <Boton variante="secundario" chico icono={Pencil} className="mt-4 self-start" onClick={() => pedir(`Editar plantilla «${p.nombre}»`)} aria-label={`Editar plantilla ${p.nombre}`}>
                    Editar mensaje
                  </Boton>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialogo}
    </div>
  );
}
