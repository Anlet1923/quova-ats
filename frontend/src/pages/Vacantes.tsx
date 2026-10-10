import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, Copy, FilterX, Search, Send, Store, XCircle } from 'lucide-react';
import { api, ApiError, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { copiar } from '../lib/portapapeles';
import { useAvisos } from '../lib/toast';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_TURNO,
  fechaCorta,
  linkPostulacion,
  PUEDE_GESTIONAR_VACANTES,
  soles,
  type Cargo,
  type EstadoVacante,
  type Tienda,
  type Vacante,
} from '../lib/tipos';
import { Boton, ErrorDeCarga, Esqueleto, EstadoVacio, Etiqueta, Modal, type Tono } from '../components/ui';

const TONO_ESTADO: Record<EstadoVacante, Tono> = { ABIERTA: 'verde', BORRADOR: 'ambar', CERRADA: 'gris' };

export default function Vacantes() {
  const { tieneRol } = useAuth();
  const avisos = useAvisos();
  const puedeGestionar = tieneRol(PUEDE_GESTIONAR_VACANTES);
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState(params.get('q') ?? '');
  const [tiendaId, setTiendaId] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [estado, setEstado] = useState('');
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [vacantes, setVacantes] = useState<Vacante[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [porCerrar, setPorCerrar] = useState<Vacante | null>(null);
  const [duplicada, setDuplicada] = useState<Vacante | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const hayFiltros = Boolean(q.trim() || tiendaId || cargoId || estado);

  const cargar = useCallback(() => {
    setError(null);
    const consulta = new URLSearchParams();
    if (q.trim()) consulta.set('q', q.trim());
    if (tiendaId) consulta.set('tiendaId', tiendaId);
    if (cargoId) consulta.set('cargoId', cargoId);
    if (estado) consulta.set('estado', estado);
    return api<Vacante[]>(`/vacantes?${consulta}`)
      .then(setVacantes)
      .catch((e) => setError(mensajeDe(e)));
  }, [q, tiendaId, cargoId, estado]);

  useEffect(() => {
    api<Tienda[]>('/tiendas').then(setTiendas).catch(() => undefined);
    api<Cargo[]>('/cargos').then(setCargos).catch(() => undefined);
  }, []);

  // Pequeña espera para no consultar en cada tecla de la búsqueda
  useEffect(() => {
    const espera = window.setTimeout(cargar, 250);
    return () => window.clearTimeout(espera);
  }, [cargar]);

  const limpiar = () => {
    setQ('');
    setTiendaId('');
    setCargoId('');
    setEstado('');
    setParams({}, { replace: true });
  };

  const copiarLink = async (v: Vacante) => {
    if (!v.token) return;
    const copiado = await copiar(linkPostulacion(v.token));
    if (copiado) avisos.exito('Link de postulación copiado al portapapeles.');
    else avisos.error('No pudimos copiar el link. Cópialo manualmente desde la barra de direcciones.');
  };

  const cerrar = async () => {
    if (!porCerrar) return;
    setTrabajando(true);
    try {
      await api(`/vacantes/${porCerrar.id}/cerrar`, { method: 'POST' });
      avisos.exito(`La vacante «${porCerrar.titulo}» se cerró. Su link ya no acepta postulaciones.`);
      setPorCerrar(null);
      await cargar();
    } catch (e) {
      avisos.error(mensajeDe(e));
    } finally {
      setTrabajando(false);
    }
  };

  const publicar = async (v: Vacante, crearIgualmente = false) => {
    setTrabajando(true);
    try {
      await api(`/vacantes/${v.id}/publicar?crearIgualmente=${crearIgualmente}`, { method: 'POST' });
      avisos.exito(`La vacante «${v.titulo}» se publicó y ya tiene su link único.`);
      setDuplicada(null);
      await cargar();
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'VACANTE_DUPLICADA') setDuplicada(v);
      else avisos.error(mensajeDe(e));
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <div>
      <section className="tarjeta p-4" aria-label="Filtros de vacantes">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por cargo o tienda…"
              aria-label="Buscar por cargo o tienda"
              className="control pl-9"
            />
          </div>
          <select className="control md:w-48" value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} aria-label="Filtrar por tienda">
            <option value="">Todas las tiendas</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
                {t.activa ? '' : ' (inactiva)'}
              </option>
            ))}
          </select>
          <select className="control md:w-48" value={cargoId} onChange={(e) => setCargoId(e.target.value)} aria-label="Filtrar por cargo">
            <option value="">Todos los cargos</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select className="control md:w-44" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="ABIERTA">Abierta</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CERRADA">Cerrada</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p className="text-sm text-slate-600" role="status" data-testid="contador-vacantes">
            {vacantes == null ? 'Buscando vacantes…' : `${vacantes.length} ${vacantes.length === 1 ? 'vacante encontrada' : 'vacantes encontradas'}`}
          </p>
          {hayFiltros && (
            <Boton variante="fantasma" chico icono={FilterX} onClick={limpiar}>
              Limpiar filtros
            </Boton>
          )}
        </div>
      </section>

      <section className="tarjeta mt-4 overflow-hidden" aria-label="Listado de vacantes">
        {error ? (
          <ErrorDeCarga mensaje={error} onReintentar={cargar} />
        ) : vacantes == null ? (
          <div className="space-y-3 p-4" role="status" aria-label="Cargando vacantes">
            {Array.from({ length: 6 }, (_, i) => (
              <Esqueleto key={i} className="h-14" />
            ))}
          </div>
        ) : vacantes.length === 0 ? (
          hayFiltros ? (
            <EstadoVacio
              icono={FilterX}
              titulo="Ninguna vacante coincide con los filtros"
              texto="Prueba con otra tienda, cargo o estado, o quita los filtros para ver todas."
              accion={<Boton onClick={limpiar}>Limpiar filtros</Boton>}
            />
          ) : (
            <EstadoVacio
              icono={Briefcase}
              titulo="Todavía no hay vacantes"
              texto="Crea la primera vacante a partir de una plantilla por cargo."
              accion={
                puedeGestionar ? (
                  <Link to="/vacantes/nueva" className="rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro">
                    Crear vacante
                  </Link>
                ) : undefined
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">ID</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Puesto</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tienda</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Candidatos</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Turno</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Salario</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vacantes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60" data-testid={`vacante-${v.id}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">V-{String(v.id).padStart(3, '0')}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{v.cargo}</span>
                        {v.urgente && <Etiqueta tono="rojo">URGENTE</Etiqueta>}
                      </div>
                      <p className="text-xs text-slate-500">
                        {v.puestos ?? '—'} {v.puestos === 1 ? 'puesto' : 'puestos'} · Creada: {fechaCorta(v.creadaEn)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                        {v.tienda ?? 'Por definir'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Etiqueta tono={TONO_ESTADO[v.estado]} punto>
                        {ETIQUETA_ESTADO[v.estado]}
                      </Etiqueta>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{v.candidatos}</td>
                    <td className="px-4 py-3 text-slate-600">{v.turno ? ETIQUETA_TURNO[v.turno] : '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{soles(v.salario)}<span className="font-normal text-slate-500">/mes</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {v.estado === 'ABIERTA' && (
                          <Boton variante="secundario" chico icono={Copy} onClick={() => copiarLink(v)} aria-label={`Copiar link de ${v.titulo}`}>
                            Copiar link
                          </Boton>
                        )}
                        {puedeGestionar && v.estado === 'ABIERTA' && (
                          <Boton variante="secundario" chico icono={XCircle} onClick={() => setPorCerrar(v)} aria-label={`Cerrar vacante ${v.titulo}`}>
                            Cerrar
                          </Boton>
                        )}
                        {puedeGestionar && v.estado === 'BORRADOR' && (
                          <Boton chico icono={Send} onClick={() => publicar(v)} disabled={trabajando} aria-label={`Publicar vacante ${v.titulo}`}>
                            Publicar
                          </Boton>
                        )}
                        {v.estado === 'CERRADA' && <span className="text-xs text-slate-400">Sin acciones</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {porCerrar && (
        <Modal
          titulo="¿Cerrar la vacante?"
          onCerrar={() => setPorCerrar(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setPorCerrar(null)}>
                Cancelar
              </Boton>
              <Boton variante="peligro" cargando={trabajando} onClick={cerrar}>
                Sí, cerrar vacante
              </Boton>
            </>
          }
        >
          <p>
            Vas a cerrar <strong className="text-slate-900">{porCerrar.titulo}</strong>. El link dejará de aceptar postulaciones.
          </p>
          <p className="mt-2">
            Los {porCerrar.candidatos} candidatos en proceso <strong className="text-slate-900">no se eliminarán</strong>.
          </p>
        </Modal>
      )}

      {duplicada && (
        <Modal
          titulo="Ya existe una vacante igual"
          onCerrar={() => setDuplicada(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setDuplicada(null)}>
                Cancelar
              </Boton>
              <Boton cargando={trabajando} onClick={() => publicar(duplicada, true)}>
                Crear igualmente
              </Boton>
            </>
          }
        >
          Hay una vacante abierta para el mismo cargo, tienda y turno que <strong className="text-slate-900">{duplicada.titulo}</strong>. Publicar otra puede
          dividir a los postulantes entre dos links.
        </Modal>
      )}
    </div>
  );
}
