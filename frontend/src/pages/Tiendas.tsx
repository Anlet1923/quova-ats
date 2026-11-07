import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Briefcase, MapPin, Minus, Pencil, Plus, Store } from 'lucide-react';
import { api, ApiError, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAvisos } from '../lib/toast';
import { iniciales, type Rol, type Tienda } from '../lib/tipos';
import { Boton, Campo, ErrorDeCarga, Esqueleto, Etiqueta, Modal } from '../components/ui';

const PUEDE_ADMINISTRAR: Rol[] = ['ADMIN'];
const AVATAR = ['bg-violet-600', 'bg-cyan-600', 'bg-emerald-600', 'bg-amber-600', 'bg-blue-600'];
const BOTON_PIE = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-slate-50';

export default function Tiendas() {
  const { tieneRol } = useAuth();
  const avisos = useAvisos();
  const administra = tieneRol(PUEDE_ADMINISTRAR);

  const [tiendas, setTiendas] = useState<Tienda[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: number; nombre: string; direccion: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [trabajando, setTrabajando] = useState(false);
  const [porCambio, setPorCambio] = useState<Tienda | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    return api<Tienda[]>('/tiendas')
      .then(setTiendas)
      .catch((e) => setError(mensajeDe(e)));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const persistir = async () => {
    if (!form) return;
    const nuevos: Record<string, string> = {};
    if (!form.nombre.trim()) nuevos.nombre = 'Ingresa el nombre de la tienda.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setTrabajando(true);
    try {
      const cuerpo = { nombre: form.nombre.trim(), direccion: form.direccion.trim() };
      const guardada = form.id
        ? await api<Tienda>(`/tiendas/${form.id}`, { method: 'POST', body: cuerpo })
        : await api<Tienda>('/tiendas', { method: 'POST', body: cuerpo });
      setTiendas((lista) => {
        const resto = (lista ?? []).filter((t) => t.id !== guardada.id);
        return [...resto, guardada].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      });
      setForm(null);
      avisos.exito(form.id ? 'Tienda actualizada.' : 'Tienda creada.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr && Object.keys(apiErr.errores).length) setErrores(apiErr.errores);
      else avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  const cambiarActiva = async () => {
    if (!porCambio) return;
    setTrabajando(true);
    try {
      const ruta = porCambio.activa ? 'desactivar' : 'activar';
      const guardada = await api<Tienda>(`/tiendas/${porCambio.id}/${ruta}`, { method: 'POST' });
      setTiendas((lista) => (lista ?? []).map((t) => (t.id === guardada.id ? guardada : t)));
      setPorCambio(null);
      avisos.exito(guardada.activa ? 'Tienda activada.' : 'Tienda desactivada.');
    } catch (err) {
      avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  if (error) return <ErrorDeCarga mensaje={error} onReintentar={cargar} />;
  if (!tiendas) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Esqueleto key={i} className="h-64" />
        ))}
      </div>
    );
  }

  const activas = tiendas.filter((t) => t.activa).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-sans text-base font-medium text-slate-600">
          {activas} tiendas activas · {tiendas.length} en total
        </h2>
        {administra && (
          <Boton icono={Plus} className="ml-auto" onClick={() => { setErrores({}); setForm({ nombre: '', direccion: '' }); }}>
            Nueva tienda
          </Boton>
        )}
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="lista-tiendas">
        {tiendas.map((t, i) => (
          <li key={t.id} className="tarjeta flex flex-col transition duration-200 hover:border-primario/40 hover:shadow-md">
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
                {t.direccion || 'Sin dirección'}
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
                <span className="font-titulo text-base font-semibold tabular-nums text-slate-900">{t.vacantesAbiertas}</span>
              </p>
            </div>

            {administra && (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4">
                <button type="button" className={`${BOTON_PIE} text-slate-700`} onClick={() => { setErrores({}); setForm({ id: t.id, nombre: t.nombre, direccion: t.direccion ?? '' }); }} aria-label={`Editar tienda ${t.nombre}`}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
                </button>
                <button
                  type="button"
                  className={`${BOTON_PIE} ${t.activa ? 'text-red-600' : 'text-emerald-700'}`}
                  onClick={() => setPorCambio(t)}
                  aria-label={`${t.activa ? 'Desactivar' : 'Activar'} tienda ${t.nombre}`}
                >
                  {t.activa ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {form && (
        <Modal
          titulo={form.id ? 'Editar tienda' : 'Nueva tienda'}
          onCerrar={() => setForm(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setForm(null)}>
                Cancelar
              </Boton>
              <Boton cargando={trabajando} onClick={() => void persistir()}>
                Guardar
              </Boton>
            </>
          }
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void persistir(); }}>
            <Campo etiqueta="Nombre" error={errores.nombre}>
              {(p) => (
                <input {...p} className={`control ${errores.nombre ? 'control-error' : ''}`} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoFocus />
              )}
            </Campo>
            <Campo etiqueta="Dirección" error={errores.direccion} opcional>
              {(p) => (
                <input {...p} className="control" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              )}
            </Campo>
          </form>
        </Modal>
      )}

      {porCambio && (
        <Modal
          titulo={porCambio.activa ? '¿Desactivar la tienda?' : '¿Activar la tienda?'}
          onCerrar={() => setPorCambio(null)}
          pie={
            porCambio.activa && porCambio.vacantesAbiertas > 0 ? (
              <Boton onClick={() => setPorCambio(null)}>Entendido</Boton>
            ) : (
              <>
                <Boton variante="secundario" onClick={() => setPorCambio(null)}>
                  Cancelar
                </Boton>
                <Boton variante={porCambio.activa ? 'peligro' : 'primario'} cargando={trabajando} onClick={cambiarActiva}>
                  {porCambio.activa ? 'Sí, desactivar' : 'Sí, activar'}
                </Boton>
              </>
            )
          }
        >
          {porCambio.activa && porCambio.vacantesAbiertas > 0 ? (
            <p>
              <strong className="text-slate-900">{porCambio.nombre}</strong> tiene {porCambio.vacantesAbiertas} vacantes abiertas. Ciérralas antes de desactivar la tienda.
            </p>
          ) : (
            <p>
              Vas a {porCambio.activa ? 'desactivar' : 'activar'} <strong className="text-slate-900">{porCambio.nombre}</strong>.
              {porCambio.activa ? ' No se podrán publicar vacantes en esta sede.' : ' Volverá a estar disponible para nuevas vacantes.'}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
