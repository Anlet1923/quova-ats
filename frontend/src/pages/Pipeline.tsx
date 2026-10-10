import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, ArrowRight, Ban, FilterX, History, Info, UserX, Users } from 'lucide-react';
import { api, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAvisos } from '../lib/toast';
import {
  ETAPAS,
  ETIQUETA_ETAPA,
  ETIQUETA_FUENTE,
  ETIQUETA_MOTIVO,
  fechaHora,
  iniciales,
  PUEDE_GESTIONAR_VACANTES,
  PUEDE_MOVER_CANDIDATOS,
  type Candidato,
  type Etapa,
  type Historial,
  type MotivoDescarte,
  type Tienda,
  type Vacante,
} from '../lib/tipos';
import { Boton, Cargando, ErrorDeCarga, Esqueleto, EstadoVacio, Etiqueta, Modal, type Tono } from '../components/ui';

const CABECERA: Record<Etapa, string> = {
  // En modo oscuro la progresión se conserva con tintes translúcidos en vez de azules claros
  NUEVO: 'bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-200',
  PRESELECCIONADO: 'bg-blue-300 text-blue-950 dark:bg-blue-500/25 dark:text-blue-100',
  ENTREVISTA: 'bg-blue-500 text-white dark:bg-blue-600/40',
  PRUEBA: 'bg-blue-600 text-white dark:bg-blue-600/60',
  OFERTA: 'bg-blue-800 text-white dark:bg-blue-700/80',
  CONTRATADO: 'bg-emerald-600 text-white dark:bg-emerald-600/50',
  DESCARTADO: 'bg-slate-400 text-white dark:bg-slate-200 dark:text-slate-700',
};

const AVATAR = ['bg-blue-700', 'bg-emerald-700', 'bg-violet-700', 'bg-cyan-700', 'bg-amber-700', 'bg-[#334155]'];
const MOTIVOS = Object.keys(ETIQUETA_MOTIVO) as MotivoDescarte[];

/** Días en la etapa: verde hoy, ámbar de 1 a 3 días, rojo desde 4. El texto acompaña siempre al color. */
function diasEnEtapa(c: Candidato): { tono: Tono; texto: string; detalle: string } {
  if (c.etapa === 'CONTRATADO' || c.etapa === 'DESCARTADO') {
    return { tono: 'gris', texto: c.diasEnEtapa === 0 ? 'Hoy' : `Hace ${c.diasEnEtapa} d`, detalle: `${ETIQUETA_ETAPA[c.etapa]} hace ${c.diasEnEtapa} días` };
  }
  if (c.diasEnEtapa === 0) return { tono: 'verde', texto: 'Hoy', detalle: 'Llegó hoy a esta etapa' };
  const detalle = `${c.diasEnEtapa} ${c.diasEnEtapa === 1 ? 'día' : 'días'} en esta etapa`;
  return { tono: c.diasEnEtapa <= 3 ? 'ambar' : 'rojo', texto: `${c.diasEnEtapa} d`, detalle: c.diasEnEtapa <= 3 ? detalle : `${detalle}: requiere atención` };
}

export default function Pipeline() {
  const { tieneRol } = useAuth();
  const avisos = useAvisos();
  const puedeMover = tieneRol(PUEDE_MOVER_CANDIDATOS);
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();

  const [vacanteId, setVacanteId] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [verDescartados, setVerDescartados] = useState(false);
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [arrastrado, setArrastrado] = useState<number | null>(null);
  const [sobre, setSobre] = useState<Etapa | null>(null);
  const [porMover, setPorMover] = useState<{ candidato: Candidato; destino: Etapa } | null>(null);
  const [bloqueo, setBloqueo] = useState<string | null>(null);
  const [porDescartar, setPorDescartar] = useState<Candidato | null>(null);
  const [motivo, setMotivo] = useState<MotivoDescarte | ''>('');
  const [comentario, setComentario] = useState('');
  const [bancoTalento, setBancoTalento] = useState(false);
  const [historial, setHistorial] = useState<{ candidato: Candidato; filas: Historial[] | null } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const hayFiltros = Boolean(vacanteId || tiendaId || q);

  const cargar = useCallback(() => {
    setError(null);
    const consulta = new URLSearchParams();
    if (vacanteId) consulta.set('vacanteId', vacanteId);
    if (tiendaId) consulta.set('tiendaId', tiendaId);
    return api<Candidato[]>(`/candidatos?${consulta}`)
      .then(setCandidatos)
      .catch((e) => setError(mensajeDe(e)));
  }, [vacanteId, tiendaId]);

  useEffect(() => {
    api<Vacante[]>('/vacantes').then((v) => setVacantes(v.filter((x) => x.estado !== 'BORRADOR'))).catch(() => undefined);
    api<Tienda[]>('/tiendas').then(setTiendas).catch(() => undefined);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(() => (candidatos ?? []).filter((c) => !q || c.nombre.toLowerCase().includes(q)), [candidatos, q]);
  const columnas: Etapa[] = verDescartados ? [...ETAPAS, 'DESCARTADO'] : ETAPAS;
  const enProceso = visibles.filter((c) => c.etapa !== 'CONTRATADO' && c.etapa !== 'DESCARTADO').length;
  const contratados = visibles.filter((c) => c.etapa === 'CONTRATADO').length;
  const descartados = visibles.filter((c) => c.etapa === 'DESCARTADO').length;

  const limpiar = () => {
    setVacanteId('');
    setTiendaId('');
    setParams({}, { replace: true });
  };

  /** Regla 2: solo se avanza. El intento de retroceso se bloquea y la tarjeta se queda en su columna. */
  const intentarMover = (candidato: Candidato, destino: Etapa) => {
    if (destino === candidato.etapa) return;
    if (candidato.etapa === 'CONTRATADO' || candidato.etapa === 'DESCARTADO') {
      setBloqueo(`${candidato.nombre} ya está en una etapa final (${ETIQUETA_ETAPA[candidato.etapa]}) y no se puede mover.`);
    } else if (destino === 'DESCARTADO') {
      abrirDescarte(candidato);
    } else if (ETAPAS.indexOf(destino) < ETAPAS.indexOf(candidato.etapa)) {
      setBloqueo(
        `${candidato.nombre} está en «${ETIQUETA_ETAPA[candidato.etapa]}» y no puede volver a «${ETIQUETA_ETAPA[destino]}». Un candidato no puede retroceder de etapa.`,
      );
    } else {
      setPorMover({ candidato, destino });
    }
  };

  const confirmarMovimiento = async () => {
    if (!porMover) return;
    setTrabajando(true);
    try {
      await api(`/candidatos/${porMover.candidato.id}/mover`, { method: 'POST', body: { etapaDestino: porMover.destino } });
      avisos.exito(`${porMover.candidato.nombre} pasó a «${ETIQUETA_ETAPA[porMover.destino]}».`);
      setPorMover(null);
      await cargar();
    } catch (e) {
      setPorMover(null);
      setBloqueo(mensajeDe(e));
    } finally {
      setTrabajando(false);
    }
  };

  const abrirDescarte = (candidato: Candidato) => {
    setMotivo('');
    setComentario('');
    setBancoTalento(false);
    setPorDescartar(candidato);
  };

  const confirmarDescarte = async () => {
    if (!porDescartar || !motivo) return;
    setTrabajando(true);
    try {
      await api(`/candidatos/${porDescartar.id}/descartar`, { method: 'POST', body: { motivo, comentario, bancoTalento } });
      avisos.exito(`${porDescartar.nombre} fue descartado${bancoTalento ? ' y guardado en el banco de talento' : ''}.`);
      setPorDescartar(null);
      await cargar();
    } catch (e) {
      avisos.error(mensajeDe(e));
    } finally {
      setTrabajando(false);
    }
  };

  const verHistorial = (candidato: Candidato) => {
    setHistorial({ candidato, filas: null });
    api<Historial[]>(`/candidatos/${candidato.id}/historial`)
      .then((filas) => setHistorial({ candidato, filas }))
      .catch((e) => {
        setHistorial(null);
        avisos.error(mensajeDe(e));
      });
  };

  const alSoltar = (e: DragEvent, destino: Etapa) => {
    e.preventDefault();
    setSobre(null);
    const id = Number(e.dataTransfer.getData('text/plain')) || arrastrado;
    setArrastrado(null);
    const candidato = candidatos?.find((c) => c.id === id);
    if (candidato) intentarMover(candidato, destino);
  };

  return (
    <div>
      <section className="tarjeta p-4" aria-label="Filtros del pipeline">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-600">
            <span className="mb-1 block font-medium">Vacante</span>
            <select className="control w-64" value={vacanteId} onChange={(e) => setVacanteId(e.target.value)}>
              <option value="">Todas las vacantes</option>
              {vacantes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.titulo}
                  {v.estado === 'CERRADA' ? ' (cerrada)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            <span className="mb-1 block font-medium">Tienda</span>
            <select className="control w-48" value={tiendaId} onChange={(e) => setTiendaId(e.target.value)}>
              <option value="">Todas las tiendas</option>
              {tiendas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={verDescartados} onChange={(e) => setVerDescartados(e.target.checked)} />
            Mostrar descartados
          </label>
          {hayFiltros && (
            <Boton variante="fantasma" chico icono={FilterX} onClick={limpiar} className="mb-1">
              Limpiar filtros
            </Boton>
          )}
          <p className="ml-auto flex flex-wrap items-center gap-2 pb-2 text-sm text-slate-600" role="status" data-testid="contador-candidatos">
            {q && <span>Búsqueda: «{params.get('q')}» ·</span>}
            <span>{enProceso} en proceso</span>
            <Etiqueta tono="verde">{contratados} contratados</Etiqueta>
            <Etiqueta tono="gris">{descartados} descartados</Etiqueta>
          </p>
        </div>
        {!puedeMover && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <Info className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            Tu rol solo permite consultar el pipeline. Los movimientos los realiza el reclutador de RR. HH.
          </p>
        )}
      </section>

      {error ? (
        <div className="tarjeta mt-4">
          <ErrorDeCarga mensaje={error} onReintentar={cargar} />
        </div>
      ) : candidatos == null ? (
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6" role="status" aria-label="Cargando el tablero">
          {Array.from({ length: 6 }, (_, i) => (
            <Esqueleto key={i} className="h-96" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="tarjeta mt-4">
          {hayFiltros ? (
            <EstadoVacio
              icono={FilterX}
              titulo="Ningún candidato coincide con los filtros"
              texto="Cambia la vacante o la tienda, o quita los filtros para ver todo el tablero."
              accion={<Boton onClick={limpiar}>Limpiar filtros</Boton>}
            />
          ) : (
            <EstadoVacio
              icono={Users}
              titulo="Aún no hay candidatos"
              texto="Publica una vacante y comparte su link para recibir las primeras postulaciones."
              accion={
                tieneRol(PUEDE_GESTIONAR_VACANTES) ? (
                  <Link to="/vacantes/nueva" className="rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro">
                    Crear vacante
                  </Link>
                ) : undefined
              }
            />
          )}
        </div>
      ) : (
        // «relative» hace que el contenedor recorte también los textos sr-only (absolutos) de las columnas que quedan fuera
        <div className="relative mt-4 overflow-x-auto pb-3">
          <div className="flex min-w-max gap-3" data-testid="tablero">
            {columnas.map((etapa) => {
              const tarjetas = visibles.filter((c) => c.etapa === etapa);
              const soltable = puedeMover && etapa !== 'DESCARTADO';
              return (
                <section
                  key={etapa}
                  aria-label={`Etapa ${ETIQUETA_ETAPA[etapa]}: ${tarjetas.length} candidatos`}
                  data-testid={`columna-${etapa}`}
                  onDragOver={soltable ? (e) => { e.preventDefault(); setSobre(etapa); } : undefined}
                  onDragLeave={soltable ? () => setSobre((actual) => (actual === etapa ? null : actual)) : undefined}
                  onDrop={soltable ? (e) => alSoltar(e, etapa) : undefined}
                  className={`flex w-[17rem] flex-col rounded-xl border bg-white transition-colors ${sobre === etapa ? 'border-primario ring-2 ring-primario/30' : 'border-slate-200'}`}
                >
                  <header className={`flex items-center justify-between rounded-t-xl px-3 py-2.5 text-sm font-semibold ${CABECERA[etapa]}`}>
                    <h2>{ETIQUETA_ETAPA[etapa]}</h2>
                    <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold">{tarjetas.length}</span>
                  </header>
                  <ul className="flex min-h-[9rem] flex-1 flex-col gap-2 p-2">
                    {tarjetas.length === 0 && <li className="px-2 py-6 text-center text-xs text-slate-400">Sin candidatos en esta etapa</li>}
                    {tarjetas.map((c) => {
                      const dias = diasEnEtapa(c);
                      const movible = puedeMover && c.etapa !== 'CONTRATADO' && c.etapa !== 'DESCARTADO';
                      const siguiente = ETAPAS[ETAPAS.indexOf(c.etapa) + 1];
                      return (
                        <li
                          key={c.id}
                          draggable={movible}
                          data-testid={`candidato-${c.id}`}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(c.id));
                            e.dataTransfer.effectAllowed = 'move';
                            setArrastrado(c.id);
                          }}
                          onDragEnd={() => {
                            setArrastrado(null);
                            setSobre(null);
                          }}
                          className={`rounded-lg border border-slate-200 bg-white p-3 shadow-tarjeta ${movible ? 'cursor-grab active:cursor-grabbing' : ''} ${
                            arrastrado === c.id ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${AVATAR[c.id % AVATAR.length]}`} aria-hidden>
                              {iniciales(c.nombre)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900" title={c.nombre}>
                                {c.nombre}
                              </p>
                              <p className="truncate text-xs text-slate-500">{c.tienda}</p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-600">{c.cargo}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Etiqueta tono="gris">{ETIQUETA_FUENTE[c.fuente]}</Etiqueta>
                            <Etiqueta tono={dias.tono} title={dias.detalle}>
                              {dias.texto}
                              <span className="sr-only">: {dias.detalle}</span>
                            </Etiqueta>
                          </div>
                          {c.etapa === 'DESCARTADO' && c.motivoDescarte && (
                            <p className="mt-2 text-xs text-slate-500">
                              Motivo: {ETIQUETA_MOTIVO[c.motivoDescarte]}
                              {c.bancoTalento && (
                                <span className="mt-1 flex items-center gap-1 font-semibold text-blue-700">
                                  <Archive className="h-3 w-3" aria-hidden /> En banco de talento
                                </span>
                              )}
                            </p>
                          )}
                          <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5">
                            {movible && siguiente && (
                              <Boton chico icono={ArrowRight} onClick={() => intentarMover(c, siguiente)} aria-label={`Avanzar a ${c.nombre} a ${ETIQUETA_ETAPA[siguiente]}`}>
                                Avanzar
                              </Boton>
                            )}
                            {movible && (
                              <Boton chico variante="secundario" icono={UserX} onClick={() => abrirDescarte(c)} aria-label={`Descartar a ${c.nombre}`}>
                                Descartar
                              </Boton>
                            )}
                            <Boton chico variante="fantasma" icono={History} onClick={() => verHistorial(c)} aria-label={`Ver historial de ${c.nombre}`} title="Ver historial de etapas" className="ml-auto">
                              {!movible && 'Historial'}
                            </Boton>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {porMover && (
        <Modal
          titulo="¿Confirmar el avance de etapa?"
          onCerrar={() => setPorMover(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setPorMover(null)}>
                Cancelar
              </Boton>
              <Boton cargando={trabajando} onClick={confirmarMovimiento}>
                Sí, avanzar
              </Boton>
            </>
          }
        >
          <p>
            Vas a mover a <strong className="text-slate-900">{porMover.candidato.nombre}</strong> de «{ETIQUETA_ETAPA[porMover.candidato.etapa]}» a{' '}
            <strong className="text-slate-900">«{ETIQUETA_ETAPA[porMover.destino]}»</strong>.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Esta acción no se puede revertir.
          </p>
        </Modal>
      )}

      {bloqueo && (
        <Modal titulo="Movimiento no permitido" onCerrar={() => setBloqueo(null)} pie={<Boton onClick={() => setBloqueo(null)}>Entendido</Boton>}>
          <p className="flex items-start gap-2">
            <Ban className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
            <span data-testid="mensaje-bloqueo">{bloqueo}</span>
          </p>
          <p className="mt-2 text-slate-500">La tarjeta volvió a su columna. Si el candidato ya no continúa, usa «Descartar» e indica el motivo.</p>
        </Modal>
      )}

      {porDescartar && (
        <Modal
          titulo={`Descartar a ${porDescartar.nombre}`}
          ancho="md"
          onCerrar={() => setPorDescartar(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setPorDescartar(null)}>
                Cancelar
              </Boton>
              <Boton variante="peligro" cargando={trabajando} disabled={!motivo} onClick={confirmarDescarte} aria-describedby="ayuda-motivo">
                Confirmar
              </Boton>
            </>
          }
        >
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900">Motivo del descarte (obligatorio)</legend>
            <div className="mt-2 space-y-1.5">
              {MOTIVOS.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 ${motivo === m ? 'border-primario bg-primario-suave' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="motivo" className="h-4 w-4" checked={motivo === m} onChange={() => setMotivo(m)} />
                  <span className="text-slate-800">{ETIQUETA_MOTIVO[m]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Comentario <span className="font-normal text-slate-400">(opcional)</span>
            </span>
            <textarea className="control" rows={2} maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </label>
          <label className="mt-3 flex items-start gap-3">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300" checked={bancoTalento} onChange={(e) => setBancoTalento(e.target.checked)} />
            <span className="text-slate-800">
              Guardar en banco de talento
              <span className="block text-xs text-slate-500">Para tenerlo en cuenta en futuras vacantes de otras tiendas.</span>
            </span>
          </label>
          <p id="ayuda-motivo" className="mt-3 text-xs text-slate-500">
            {motivo ? 'El descarte quedará registrado en el historial del candidato.' : 'Elige un motivo para habilitar el botón «Confirmar».'}
          </p>
        </Modal>
      )}

      {historial && (
        <Modal titulo={`Historial de ${historial.candidato.nombre}`} ancho="md" onCerrar={() => setHistorial(null)} pie={<Boton onClick={() => setHistorial(null)}>Cerrar</Boton>}>
          {historial.filas == null ? (
            <Cargando texto="Cargando historial…" />
          ) : (
            <ol className="space-y-3" data-testid="historial">
              {historial.filas.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primario" aria-hidden />
                  <div>
                    <p className="font-medium text-slate-900">
                      {h.etapaOrigen ? `${ETIQUETA_ETAPA[h.etapaOrigen]} → ${ETIQUETA_ETAPA[h.etapaDestino]}` : `Ingresó en «${ETIQUETA_ETAPA[h.etapaDestino]}»`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fechaHora(h.fecha)} · {h.usuario}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Modal>
      )}
    </div>
  );
}
