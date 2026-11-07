import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Briefcase, CreditCard, Home, Mail, MessageCircle, Package, Pencil, Plus, ShieldCheck, ShoppingBag, Users, type LucideIcon } from 'lucide-react';
import { api, ApiError, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAvisos } from '../lib/toast';
import { ETIQUETA_ROL, iniciales, soles, type Cargo, type Plantilla, type Rol, type Tienda, type Usuario, type Vacante } from '../lib/tipos';
import { Boton, Campo, ErrorDeCarga, Esqueleto, Etiqueta, Modal, type Tono } from '../components/ui';
import { SinAcceso } from './Avisos';

const ROLES_ADMIN: Rol[] = ['ADMIN'];
const ROLES = Object.keys(ETIQUETA_ROL) as Rol[];
const TONO_ROL: Record<Rol, Tono> = { ADMIN: 'rojo', GERENTE_REGIONAL: 'verde', JEFE_TIENDA: 'ambar', RECLUTADOR: 'azul' };
const AVATAR = ['bg-violet-600', 'bg-cyan-600', 'bg-amber-600', 'bg-blue-600', 'bg-slate-400'];
const PERMISOS: { rol: Rol; texto: string }[] = [
  { rol: 'ADMIN', texto: 'Acceso completo: usuarios, roles, cargos, plantillas y tiendas.' },
  { rol: 'RECLUTADOR', texto: 'Crea y publica vacantes, mueve candidatos y agenda entrevistas.' },
  { rol: 'JEFE_TIENDA', texto: 'Consulta su tienda y registra el resultado de sus entrevistas.' },
  { rol: 'GERENTE_REGIONAL', texto: 'Consulta los indicadores y procesos de toda la cadena.' },
];
const ICONO_CARGO: Record<string, LucideIcon> = { 'Vendedor/a': ShoppingBag, 'Cajero/a': CreditCard, 'Encargado de local': Home, 'Personal de almacén': Package };
const PESTANAS = ['Usuarios y roles', 'Cargos', 'Plantillas'] as const;
type Pestana = (typeof PESTANAS)[number];

interface FormUsuario {
  id?: number;
  nombre: string;
  correo: string;
  rol: Rol;
  tiendaId: string;
  password: string;
  activo: boolean;
}

interface FormCargo {
  id?: number;
  nombre: string;
  salario: string;
  descripcion: string;
  requisitos: string;
}

interface FormPlantilla {
  id?: number;
  nombre: string;
  canal: string;
  momento: string;
  mensaje: string;
}

const CANALES = ['WhatsApp', 'Correo', 'WhatsApp y correo'];

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
  const avisos = useAvisos();
  const [pestana, setPestana] = useState<Pestana>('Usuarios y roles');
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [cargos, setCargos] = useState<Cargo[] | null>(null);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [abiertas, setAbiertas] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [usuarioForm, setUsuarioForm] = useState<FormUsuario | null>(null);
  const [cargoForm, setCargoForm] = useState<FormCargo | null>(null);
  const [plantillaForm, setPlantillaForm] = useState<FormPlantilla | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[] | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [trabajando, setTrabajando] = useState(false);

  const cargar = useCallback(() => {
    setError(null);
    return Promise.all([api<Usuario[]>('/usuarios'), api<Cargo[]>('/cargos'), api<Tienda[]>('/tiendas'), api<Vacante[]>('/vacantes'), api<Plantilla[]>('/plantillas')])
      .then(([u, c, t, v, p]) => {
        setUsuarios(u);
        setCargos(c);
        setTiendas(t);
        setPlantillas(p);
        const conteo: Record<number, number> = {};
        v.filter((item) => item.estado === 'ABIERTA').forEach((item) => {
          conteo[item.cargoId] = (conteo[item.cargoId] ?? 0) + 1;
        });
        setAbiertas(conteo);
      })
      .catch((e) => setError(mensajeDe(e)));
  }, []);

  useEffect(() => {
    if (tieneRol(ROLES_ADMIN)) void cargar();
  }, [cargar, tieneRol]);

  if (!tieneRol(ROLES_ADMIN)) return <SinAcceso />;

  const guardarUsuario = async () => {
    if (!usuarioForm) return;
    const nuevos: Record<string, string> = {};
    if (!usuarioForm.nombre.trim()) nuevos.nombre = 'Ingresa el nombre.';
    if (!usuarioForm.correo.trim()) nuevos.correo = 'Ingresa el correo corporativo.';
    if (usuarioForm.rol === 'JEFE_TIENDA' && !usuarioForm.tiendaId) nuevos.tiendaId = 'Elige la tienda del jefe.';
    if (!usuarioForm.id && usuarioForm.password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (usuarioForm.id && usuarioForm.password && usuarioForm.password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setTrabajando(true);
    try {
      const cuerpo = {
        nombre: usuarioForm.nombre.trim(),
        correo: usuarioForm.correo.trim(),
        rol: usuarioForm.rol,
        tiendaId: usuarioForm.rol === 'JEFE_TIENDA' ? Number(usuarioForm.tiendaId) : null,
        password: usuarioForm.password || null,
        activo: usuarioForm.activo,
      };
      const guardado = usuarioForm.id
        ? await api<Usuario>(`/usuarios/${usuarioForm.id}`, { method: 'POST', body: cuerpo })
        : await api<Usuario>('/usuarios', { method: 'POST', body: cuerpo });
      setUsuarios((lista) => {
        const resto = (lista ?? []).filter((u) => u.id !== guardado.id);
        return [...resto, guardado].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      });
      setUsuarioForm(null);
      avisos.exito(usuarioForm.id ? 'Usuario actualizado.' : 'Usuario creado.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr && Object.keys(apiErr.errores).length) setErrores(apiErr.errores);
      else avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  const guardarCargo = async () => {
    if (!cargoForm) return;
    const salario = Number(cargoForm.salario);
    const nuevos: Record<string, string> = {};
    if (!cargoForm.nombre.trim()) nuevos.nombre = 'Ingresa el nombre del cargo.';
    if (!salario || salario <= 0) nuevos.salarioBase = 'El salario debe ser mayor a cero.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setTrabajando(true);
    try {
      const cuerpo = {
        nombre: cargoForm.nombre.trim(),
        salarioBase: salario,
        descripcion: cargoForm.descripcion.trim(),
        requisitos: cargoForm.requisitos.trim(),
      };
      const guardado = cargoForm.id
        ? await api<Cargo>(`/cargos/${cargoForm.id}`, { method: 'POST', body: cuerpo })
        : await api<Cargo>('/cargos', { method: 'POST', body: cuerpo });
      setCargos((lista) => {
        const resto = (lista ?? []).filter((c) => c.id !== guardado.id);
        return [...resto, guardado].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      });
      setCargoForm(null);
      avisos.exito(cargoForm.id ? 'Cargo actualizado.' : 'Cargo creado.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr && Object.keys(apiErr.errores).length) setErrores(apiErr.errores);
      else avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  const guardarPlantilla = async () => {
    if (!plantillaForm) return;
    const nuevos: Record<string, string> = {};
    if (!plantillaForm.nombre.trim()) nuevos.nombre = 'Ingresa el nombre de la plantilla.';
    if (!plantillaForm.momento.trim()) nuevos.momento = 'Indica cuándo se envía.';
    if (!plantillaForm.mensaje.trim()) nuevos.mensaje = 'Escribe el mensaje.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setTrabajando(true);
    try {
      const cuerpo = {
        nombre: plantillaForm.nombre.trim(),
        canal: plantillaForm.canal,
        momento: plantillaForm.momento.trim(),
        mensaje: plantillaForm.mensaje.trim(),
      };
      const guardada = plantillaForm.id
        ? await api<Plantilla>(`/plantillas/${plantillaForm.id}`, { method: 'POST', body: cuerpo })
        : await api<Plantilla>('/plantillas', { method: 'POST', body: cuerpo });
      setPlantillas((lista) => {
        const resto = (lista ?? []).filter((p) => p.id !== guardada.id);
        return [...resto, guardada].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      });
      setPlantillaForm(null);
      avisos.exito(plantillaForm.id ? 'Plantilla actualizada.' : 'Plantilla creada.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr && Object.keys(apiErr.errores).length) setErrores(apiErr.errores);
      else avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  if (error) return <ErrorDeCarga mensaje={error} onReintentar={cargar} />;
  if (!usuarios || !cargos || !plantillas) {
    return (
      <div className="space-y-4">
        <Esqueleto className="h-12" />
        <Esqueleto className="h-80" />
      </div>
    );
  }

  const totales: Record<Pestana, number> = {
    'Usuarios y roles': usuarios.length,
    Cargos: cargos.length,
    Plantillas: plantillas.length,
  };
  const accion = pestana === 'Usuarios y roles' ? 'Invitar usuario' : pestana === 'Cargos' ? 'Nuevo cargo' : 'Nueva plantilla';
  const activos = usuarios.filter((u) => u.activo).length;

  return (
    <div>
      <h2 className="sr-only">Configuración del sistema</h2>
      <div className="flex flex-wrap items-center gap-3">
        <div className="tarjeta flex flex-wrap gap-1 p-1" role="tablist" aria-label="Secciones de configuración">
          {PESTANAS.map((nombre) => {
            const elegida = pestana === nombre;
            const Icono = nombre === 'Usuarios y roles' ? Users : nombre === 'Cargos' ? Briefcase : MessageCircle;
            return (
              <button
                key={nombre}
                type="button"
                role="tab"
                aria-selected={elegida}
                onClick={() => setPestana(nombre)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  elegida ? 'bg-primario text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icono className="h-4 w-4" aria-hidden />
                {nombre}
                <span className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${elegida ? 'bg-white/25' : 'bg-slate-100 text-slate-500'}`}>{totales[nombre]}</span>
              </button>
            );
          })}
        </div>
        <Boton
          icono={Plus}
          className="ml-auto"
          onClick={() => {
            setErrores({});
            if (pestana === 'Usuarios y roles') {
              setUsuarioForm({ nombre: '', correo: '', rol: 'RECLUTADOR', tiendaId: '', password: '', activo: true });
            } else if (pestana === 'Cargos') {
              setCargoForm({ nombre: '', salario: '', descripcion: '', requisitos: '' });
            } else {
              setPlantillaForm({ nombre: '', canal: 'WhatsApp', momento: '', mensaje: '' });
            }
          }}
        >
          {accion}
        </Boton>
      </div>

      <div className="mt-4 motion-safe:animate-entrada" key={pestana} role="tabpanel" aria-label={pestana}>
        {pestana === 'Usuarios y roles' && (
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="tarjeta overflow-hidden" aria-label="Usuarios del panel">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-900">{activos} usuarios activos</h3>
                <p className="text-xs text-slate-500">{usuarios.length} personas con acceso al panel</p>
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
                    {usuarios.map((u, i) => (
                      <tr key={u.id} className={`hover:bg-slate-50/60 ${u.activo ? '' : 'opacity-70'}`}>
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
                          <Boton
                            variante="secundario"
                            chico
                            icono={Pencil}
                            aria-label={`Editar a ${u.nombre}`}
                            onClick={() => {
                              setErrores({});
                              setUsuarioForm({
                                id: u.id,
                                nombre: u.nombre,
                                correo: u.correo,
                                rol: u.rol,
                                tiendaId: u.tiendaId ? String(u.tiendaId) : '',
                                password: '',
                                activo: u.activo,
                              });
                            }}
                          >
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
                  const total = usuarios.filter((u) => u.rol === rol).length;
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
            {cargos.map((c) => {
              const Icono = ICONO_CARGO[c.nombre] ?? Briefcase;
              return (
                <li key={c.id} className="tarjeta flex flex-col p-5 transition duration-200 hover:border-primario/40 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primario-suave text-primario">
                    <Icono className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{c.nombre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.descripcion || 'Sin descripción'}</p>
                  <dl className="mt-auto grid grid-cols-2 gap-3 pt-5">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Salario base</dt>
                      <dd className="mt-0.5 font-titulo text-lg font-semibold tabular-nums text-slate-900">{soles(c.salarioBase)}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Vacantes</dt>
                      <dd className="mt-0.5 font-titulo text-lg font-semibold tabular-nums text-slate-900">{abiertas[c.id] ?? 0}</dd>
                    </div>
                  </dl>
                  <Boton
                    variante="secundario"
                    chico
                    icono={Pencil}
                    className="mt-4 self-start"
                    aria-label={`Editar cargo ${c.nombre}`}
                    onClick={() => {
                      setErrores({});
                      setCargoForm({
                        id: c.id,
                        nombre: c.nombre,
                        salario: String(c.salarioBase),
                        descripcion: c.descripcion ?? '',
                        requisitos: c.requisitos ?? '',
                      });
                    }}
                  >
                    Editar
                  </Boton>
                </li>
              );
            })}
          </ul>
        )}

        {pestana === 'Plantillas' && (
          <ul className="grid gap-4 lg:grid-cols-2">
            {plantillas.map((p) => {
              const Icono = p.canal === 'Correo' ? Mail : MessageCircle;
              return (
                <li key={p.id} className="tarjeta flex flex-col p-5">
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
                  <Boton
                    variante="secundario"
                    chico
                    icono={Pencil}
                    className="mt-4 self-start"
                    aria-label={`Editar plantilla ${p.nombre}`}
                    onClick={() => {
                      setErrores({});
                      setPlantillaForm({ id: p.id, nombre: p.nombre, canal: p.canal, momento: p.momento, mensaje: p.mensaje });
                    }}
                  >
                    Editar
                  </Boton>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {usuarioForm && (
        <Modal
          titulo={usuarioForm.id ? 'Editar usuario' : 'Invitar usuario'}
          onCerrar={() => setUsuarioForm(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setUsuarioForm(null)}>Cancelar</Boton>
              <Boton cargando={trabajando} onClick={() => void guardarUsuario()}>Guardar</Boton>
            </>
          }
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void guardarUsuario(); }}>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              {(p) => <input {...p} className={`control ${errores.nombre ? 'control-error' : ''}`} value={usuarioForm.nombre} onChange={(e) => setUsuarioForm({ ...usuarioForm, nombre: e.target.value })} autoFocus />}
            </Campo>
            <Campo etiqueta="Correo" error={errores.correo}>
              {(p) => <input {...p} className={`control ${errores.correo ? 'control-error' : ''}`} value={usuarioForm.correo} onChange={(e) => setUsuarioForm({ ...usuarioForm, correo: e.target.value })} />}
            </Campo>
            <Campo etiqueta="Rol" error={errores.rol}>
              {(p) => (
                <select {...p} className="control" value={usuarioForm.rol} onChange={(e) => setUsuarioForm({ ...usuarioForm, rol: e.target.value as Rol })}>
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>{ETIQUETA_ROL[rol]}</option>
                  ))}
                </select>
              )}
            </Campo>
            {usuarioForm.rol === 'JEFE_TIENDA' && (
              <Campo etiqueta="Tienda" error={errores.tiendaId}>
                {(p) => (
                  <select {...p} className={`control ${errores.tiendaId ? 'control-error' : ''}`} value={usuarioForm.tiendaId} onChange={(e) => setUsuarioForm({ ...usuarioForm, tiendaId: e.target.value })}>
                    <option value="">Selecciona una tienda</option>
                    {tiendas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                )}
              </Campo>
            )}
            <Campo etiqueta="Contraseña" error={errores.password} opcional={Boolean(usuarioForm.id)} ayuda={usuarioForm.id ? 'Déjala vacía para no cambiarla.' : undefined}>
              {(p) => <input {...p} type="password" className={`control ${errores.password ? 'control-error' : ''}`} value={usuarioForm.password} onChange={(e) => setUsuarioForm({ ...usuarioForm, password: e.target.value })} />}
            </Campo>
            {usuarioForm.id && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={usuarioForm.activo} onChange={(e) => setUsuarioForm({ ...usuarioForm, activo: e.target.checked })} />
                Usuario activo
              </label>
            )}
          </form>
        </Modal>
      )}

      {cargoForm && (
        <Modal
          titulo={cargoForm.id ? 'Editar cargo' : 'Nuevo cargo'}
          ancho="md"
          onCerrar={() => setCargoForm(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setCargoForm(null)}>Cancelar</Boton>
              <Boton cargando={trabajando} onClick={() => void guardarCargo()}>Guardar</Boton>
            </>
          }
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void guardarCargo(); }}>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              {(p) => <input {...p} className={`control ${errores.nombre ? 'control-error' : ''}`} value={cargoForm.nombre} onChange={(e) => setCargoForm({ ...cargoForm, nombre: e.target.value })} autoFocus />}
            </Campo>
            <Campo etiqueta="Salario base" error={errores.salarioBase}>
              {(p) => <input {...p} type="number" min="1" className={`control ${errores.salarioBase ? 'control-error' : ''}`} value={cargoForm.salario} onChange={(e) => setCargoForm({ ...cargoForm, salario: e.target.value })} />}
            </Campo>
            <Campo etiqueta="Descripción" error={errores.descripcion} opcional>
              {(p) => <textarea {...p} rows={3} className="control" value={cargoForm.descripcion} onChange={(e) => setCargoForm({ ...cargoForm, descripcion: e.target.value })} />}
            </Campo>
            <Campo etiqueta="Requisitos" error={errores.requisitos} opcional>
              {(p) => <textarea {...p} rows={3} className="control" value={cargoForm.requisitos} onChange={(e) => setCargoForm({ ...cargoForm, requisitos: e.target.value })} />}
            </Campo>
          </form>
        </Modal>
      )}
      {plantillaForm && (
        <Modal
          titulo={plantillaForm.id ? 'Editar plantilla' : 'Nueva plantilla'}
          ancho="md"
          onCerrar={() => setPlantillaForm(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setPlantillaForm(null)}>Cancelar</Boton>
              <Boton cargando={trabajando} onClick={() => void guardarPlantilla()}>Guardar</Boton>
            </>
          }
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void guardarPlantilla(); }}>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              {(p) => <input {...p} className={`control ${errores.nombre ? 'control-error' : ''}`} value={plantillaForm.nombre} onChange={(e) => setPlantillaForm({ ...plantillaForm, nombre: e.target.value })} autoFocus />}
            </Campo>
            <Campo etiqueta="Canal" error={errores.canal}>
              {(p) => (
                <select {...p} className="control" value={plantillaForm.canal} onChange={(e) => setPlantillaForm({ ...plantillaForm, canal: e.target.value })}>
                  {CANALES.map((canal) => (
                    <option key={canal} value={canal}>{canal}</option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Cuándo se envía" error={errores.momento}>
              {(p) => <input {...p} className={`control ${errores.momento ? 'control-error' : ''}`} value={plantillaForm.momento} onChange={(e) => setPlantillaForm({ ...plantillaForm, momento: e.target.value })} />}
            </Campo>
            <Campo etiqueta="Mensaje" error={errores.mensaje} ayuda="Puedes usar {nombre}, {cargo}, {tienda}, {fecha}, {hora} y {resultado}.">
              {(p) => <textarea {...p} rows={4} className={`control ${errores.mensaje ? 'control-error' : ''}`} value={plantillaForm.mensaje} onChange={(e) => setPlantillaForm({ ...plantillaForm, mensaje: e.target.value })} />}
            </Campo>
          </form>
        </Modal>
      )}
    </div>
  );
}
