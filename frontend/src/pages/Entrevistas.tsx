import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, List, Plus, Star } from 'lucide-react';
import { api, ApiError, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAvisos } from '../lib/toast';
import { iniciales, type Candidato, type Entrevista, type ResultadoEntrevista, type Rol } from '../lib/tipos';
import { Boton, Campo, ErrorDeCarga, Esqueleto, Etiqueta, Modal } from '../components/ui';
import { Cifra } from '../components/modulo';

const PUEDE_AGENDAR: Rol[] = ['RECLUTADOR'];
const HORAS = ['09:00', '10:00', '11:00', '15:00', '16:00'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const AVATAR = ['bg-blue-700', 'bg-emerald-700', 'bg-violet-700', 'bg-cyan-700', 'bg-amber-700'];
const TEXTO_RESULTADO = { APROBADO: 'Aprobado', EN_ESPERA: 'En espera' };

function semanaActual(): { fechas: Date[]; hoy: number } {
  const hoy = new Date();
  const indice = (hoy.getDay() + 6) % 7;
  const fechas = DIAS.map((_, i) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - indice + i));
  return { fechas, hoy: indice };
}

function rango(fechas: Date[]): string {
  const mes = fechas[4].toLocaleDateString('es-PE', { month: 'short', year: 'numeric' });
  return `Semana ${fechas[0].getDate()} – ${fechas[4].getDate()} ${mes}`;
}

function clave(fecha: Date): string {
  return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
}

function partes(iso: string): { dia: string; hora: string } {
  const fecha = new Date(iso);
  return { dia: clave(fecha), hora: `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}` };
}

function fechaLocal(dia: string, hora: string): string {
  return `${dia}T${hora}:00`;
}

export default function Entrevistas() {
  const { usuario, tieneRol } = useAuth();
  const avisos = useAvisos();
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario');
  const [entrevistas, setEntrevistas] = useState<Entrevista[] | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cita, setCita] = useState<{ candidatoId: string; dia: string; hora: string } | null>(null);
  const [evaluar, setEvaluar] = useState<Entrevista | null>(null);
  const [resultado, setResultado] = useState<ResultadoEntrevista>('APROBADO');
  const [estrellas, setEstrellas] = useState(5);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [trabajando, setTrabajando] = useState(false);
  const { fechas, hoy } = semanaActual();

  const cargar = useCallback(() => {
    setError(null);
    return Promise.all([api<Entrevista[]>('/entrevistas'), api<Candidato[]>('/candidatos')])
      .then(([e, c]) => {
        setEntrevistas(e);
        setCandidatos(c);
      })
      .catch((err) => setError(mensajeDe(err)));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardarCita = async () => {
    if (!cita) return;
    const nuevos: Record<string, string> = {};
    if (!cita.candidatoId) nuevos.candidatoId = 'Elige el candidato.';
    if (!cita.dia) nuevos.fechaHora = 'Elige la fecha y la hora.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setTrabajando(true);
    try {
      const guardada = await api<Entrevista>('/entrevistas', {
        method: 'POST',
        body: { candidatoId: Number(cita.candidatoId), fechaHora: fechaLocal(cita.dia, cita.hora) },
      });
      setEntrevistas((lista) => [...(lista ?? []), guardada].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora)));
      setCita(null);
      avisos.exito('Entrevista agendada.');
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr && Object.keys(apiErr.errores).length) setErrores(apiErr.errores);
      else avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  const guardarEvaluacion = async () => {
    if (!evaluar) return;
    setTrabajando(true);
    try {
      const guardada = await api<Entrevista>(`/entrevistas/${evaluar.id}/evaluar`, {
        method: 'POST',
        body: { resultado, estrellas },
      });
      setEntrevistas((lista) => (lista ?? []).map((e) => (e.id === guardada.id ? guardada : e)));
      setEvaluar(null);
      avisos.exito('Evaluación guardada.');
    } catch (err) {
      avisos.error(mensajeDe(err));
    } finally {
      setTrabajando(false);
    }
  };

  if (error) return <ErrorDeCarga mensaje={error} onReintentar={cargar} />;
  if (!entrevistas) return <Esqueleto className="h-80" />;

  const pendientes = entrevistas.filter((e) => e.estado === 'PENDIENTE').length;
  const completadas = entrevistas.filter((e) => e.estado === 'COMPLETADA').length;
  const aprobados = entrevistas.filter((e) => e.resultado === 'APROBADO').length;
  const claves = fechas.map(clave);
  const puedeEvaluar = (e: Entrevista) =>
    usuario?.rol === 'JEFE_TIENDA' && e.estado === 'PENDIENTE' && e.tiendaId === usuario.tiendaId;
  const ocupados = new Set(entrevistas.filter((e) => e.estado === 'PENDIENTE').map((e) => e.candidatoId));
  const elegibles = candidatos.filter((c) => c.etapa !== 'DESCARTADO' && c.etapa !== 'CONTRATADO' && !ocupados.has(c.id));

  const selector = (valor: 'calendario' | 'lista', Icono: typeof List, texto: string) => (
    <button
      type="button"
      onClick={() => setVista(valor)}
      aria-pressed={vista === valor}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
        vista === valor ? 'bg-primario text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icono className="h-4 w-4" aria-hidden />
      {texto}
    </button>
  );

  const tarjeta = (e: Entrevista, dia: number) => (
    <article key={e.id} className="h-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-tarjeta">
      <div className="flex items-start gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${AVATAR[dia % AVATAR.length]}`} aria-hidden>
          {iniciales(e.candidato)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900" title={e.candidato}>{e.candidato}</p>
          <p className="truncate text-xs text-slate-500">{e.cargo} · {e.tienda}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Etiqueta tono={e.estado === 'COMPLETADA' ? 'verde' : 'azul'}>{e.estado === 'COMPLETADA' ? 'Completada' : 'Pendiente'}</Etiqueta>
        {e.resultado && (
          <span className="flex items-center gap-2">
            <Etiqueta tono={e.resultado === 'APROBADO' ? 'verde' : 'ambar'}>{TEXTO_RESULTADO[e.resultado]}</Etiqueta>
            <span className="flex text-slate-700" role="img" aria-label={`${e.estrellas} de 5 estrellas`}>
              {Array.from({ length: e.estrellas ?? 0 }, (_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" aria-hidden />
              ))}
            </span>
          </span>
        )}
        {puedeEvaluar(e) && (
          <button type="button" className="text-xs font-semibold text-primario" onClick={() => { setResultado('APROBADO'); setEstrellas(5); setEvaluar(e); }}>
            Evaluar
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div>
      <h2 className="sr-only">Calendario de entrevistas</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Cifra valor={pendientes} texto="Pendientes" />
        <Cifra valor={completadas} texto="Completadas" tono="verde" />
        <Cifra valor={aprobados} texto="Candidatos aprobados" tono="violeta" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="tarjeta flex gap-1 p-1" role="group" aria-label="Vista de las entrevistas">
          {selector('calendario', CalendarDays, 'Calendario')}
          {selector('lista', List, 'Lista')}
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">{rango(fechas)}</span>
        {tieneRol(PUEDE_AGENDAR) && (
          <Boton
            icono={Plus}
            className="ml-auto"
            onClick={() => {
              setErrores({});
              const hoyFecha = new Date();
              const dia = `${hoyFecha.getFullYear()}-${String(hoyFecha.getMonth() + 1).padStart(2, '0')}-${String(hoyFecha.getDate()).padStart(2, '0')}`;
              setCita({ candidatoId: '', dia, hora: '10:00' });
            }}
          >
            Agendar entrevista
          </Boton>
        )}
      </div>

      {entrevistas.length === 0 && <p className="mt-4 text-sm text-slate-500">Todavía no hay entrevistas guardadas.</p>}

      {vista === 'calendario' ? (
        <section className="tarjeta relative mt-4 overflow-x-auto" aria-label="Calendario semanal de entrevistas">
          <div className="grid min-w-[860px] grid-cols-[4.5rem_repeat(5,minmax(0,1fr))]">
            <div className="border-b border-slate-200 bg-slate-50" />
            {DIAS.map((dia, i) => {
              const total = entrevistas.filter((e) => partes(e.fechaHora).dia === claves[i]).length;
              return (
                <div key={dia} className={`border-b border-l border-slate-200 px-3 py-3 text-center ${i === hoy ? 'bg-primario text-white' : 'bg-slate-50 text-slate-900'}`}>
                  <p className="text-sm font-semibold">{dia} {fechas[i].getDate()}</p>
                  <span className={`mt-1 inline-block rounded-full px-1.5 text-[11px] font-bold ${i === hoy ? 'bg-white/25' : 'bg-primario-suave text-primario'}`}>{total}</span>
                </div>
              );
            })}
            {HORAS.map((hora) => (
              <div key={hora} className="contents">
                <div className="border-b border-slate-100 px-3 py-4 text-right text-xs font-medium text-slate-500">{hora}</div>
                {DIAS.map((dia, i) => {
                  const delSlot = entrevistas.filter((e) => {
                    const p = partes(e.fechaHora);
                    return p.dia === claves[i] && p.hora === hora;
                  });
                  return (
                    <div key={dia} className={`min-h-[6.5rem] space-y-2 border-b border-l border-slate-100 p-2 ${i === hoy ? 'bg-primario-suave/60' : ''}`}>
                      {delSlot.map((e) => tarjeta(e, i))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="tarjeta mt-4 overflow-hidden" aria-label="Listado de entrevistas">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Fecha y hora</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Candidato</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Tienda</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entrevistas.map((e) => {
                  const fecha = new Date(e.fechaHora);
                  return (
                    <tr key={e.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="text-xs text-slate-500">{partes(e.fechaHora).hora}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{e.candidato}</p>
                        <p className="text-xs text-slate-500">{e.cargo}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{e.tienda}</td>
                      <td className="px-4 py-3">
                        <Etiqueta tono={e.estado === 'COMPLETADA' ? 'verde' : 'azul'}>{e.estado === 'COMPLETADA' ? 'Completada' : 'Pendiente'}</Etiqueta>
                      </td>
                      <td className="px-4 py-3">
                        {e.resultado ? (
                          <span className="flex items-center gap-2">
                            <Etiqueta tono={e.resultado === 'APROBADO' ? 'verde' : 'ambar'}>{TEXTO_RESULTADO[e.resultado]}</Etiqueta>
                            <span className="text-xs text-slate-500">{e.estrellas}/5</span>
                          </span>
                        ) : puedeEvaluar(e) ? (
                          <button type="button" className="text-sm font-semibold text-primario" onClick={() => { setResultado('APROBADO'); setEstrellas(5); setEvaluar(e); }}>Evaluar</button>
                        ) : (
                          <span className="text-xs text-slate-400">Sin evaluar</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {cita && (
        <Modal
          titulo="Agendar entrevista"
          onCerrar={() => setCita(null)}
          pie={<><Boton variante="secundario" onClick={() => setCita(null)}>Cancelar</Boton><Boton cargando={trabajando} onClick={() => void guardarCita()}>Guardar</Boton></>}
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void guardarCita(); }}>
            <Campo etiqueta="Candidato" error={errores.candidatoId}>
              {(p) => (
                <select {...p} className={`control ${errores.candidatoId ? 'control-error' : ''}`} value={cita.candidatoId} onChange={(e) => setCita({ ...cita, candidatoId: e.target.value })}>
                  <option value="">Selecciona un candidato</option>
                  {elegibles.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} · {c.cargo} · {c.tienda}</option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Fecha" error={errores.fechaHora}>
              {(p) => <input {...p} type="date" className="control" value={cita.dia} onChange={(e) => setCita({ ...cita, dia: e.target.value })} />}
            </Campo>
            <Campo etiqueta="Hora">
              {(p) => (
                <select {...p} className="control" value={cita.hora} onChange={(e) => setCita({ ...cita, hora: e.target.value })}>
                  {HORAS.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                </select>
              )}
            </Campo>
          </form>
        </Modal>
      )}

      {evaluar && (
        <Modal
          titulo={`Evaluar a ${evaluar.candidato}`}
          onCerrar={() => setEvaluar(null)}
          pie={<><Boton variante="secundario" onClick={() => setEvaluar(null)}>Cancelar</Boton><Boton cargando={trabajando} onClick={() => void guardarEvaluacion()}>Guardar</Boton></>}
        >
          <form className="space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); void guardarEvaluacion(); }}>
            <Campo etiqueta="Resultado">
              {(p) => (
                <select {...p} className="control" value={resultado} onChange={(e) => setResultado(e.target.value as ResultadoEntrevista)}>
                  <option value="APROBADO">Aprobado</option>
                  <option value="EN_ESPERA">En espera</option>
                </select>
              )}
            </Campo>
            <Campo etiqueta="Estrellas">
              {(p) => <input {...p} type="number" min={1} max={5} className="control" value={estrellas} onChange={(e) => setEstrellas(Number(e.target.value))} />}
            </Campo>
          </form>
        </Modal>
      )}
    </div>
  );
}
