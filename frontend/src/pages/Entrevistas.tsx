import { useState } from 'react';
import { CalendarDays, List, Plus, Star } from 'lucide-react';
import { ENTREVISTAS, HORAS_ENTREVISTA, type EntrevistaDemo } from '../lib/demo';
import { useAuth } from '../lib/auth';
import { iniciales, type Rol } from '../lib/tipos';
import { Boton, Etiqueta } from '../components/ui';
import { Cifra, DatosDeMuestra, useAccionPendiente } from '../components/modulo';

/** Solo el reclutador agenda y reprograma; los demás roles consultan (Tabla 5 del informe). */
const PUEDE_AGENDAR: Rol[] = ['RECLUTADOR'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const AVATAR = ['bg-blue-700', 'bg-emerald-700', 'bg-violet-700', 'bg-cyan-700', 'bg-amber-700'];

/** Las entrevistas de muestra se colocan sobre la semana en curso para que el calendario siempre se vea vigente. */
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

/** Estado y resultado combinan siempre color y texto (WCAG 1.4.1). */
function Estado({ e }: { e: EntrevistaDemo }) {
  return <Etiqueta tono={e.estado === 'Completada' ? 'verde' : 'azul'}>{e.estado}</Etiqueta>;
}

function Resultado({ e }: { e: EntrevistaDemo }) {
  if (!e.resultado) return null;
  return (
    <span className="flex items-center gap-2">
      <Etiqueta tono={e.resultado === 'Aprobado' ? 'verde' : 'ambar'}>{e.resultado}</Etiqueta>
      <span className="flex text-slate-700" role="img" aria-label={`${e.estrellas} de 5 estrellas`}>
        {Array.from({ length: e.estrellas ?? 0 }, (_, i) => (
          <Star key={i} className="h-3 w-3 fill-current" aria-hidden />
        ))}
      </span>
    </span>
  );
}

export default function Entrevistas() {
  const { tieneRol } = useAuth();
  const { pedir, dialogo } = useAccionPendiente();
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario');
  const { fechas, hoy } = semanaActual();
  const pendientes = ENTREVISTAS.filter((e) => e.estado === 'Pendiente').length;
  const completadas = ENTREVISTAS.filter((e) => e.estado === 'Completada').length;
  const aprobados = ENTREVISTAS.filter((e) => e.resultado === 'Aprobado').length;

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

  return (
    <div>
      <h2 className="sr-only">Calendario de entrevistas</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <Cifra valor={pendientes} texto="Pendientes esta semana" />
        <Cifra valor={completadas} texto="Completadas" tono="verde" />
        <Cifra valor={aprobados} texto="Candidatos aprobados" tono="violeta" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="tarjeta flex gap-1 p-1" role="group" aria-label="Vista de las entrevistas">
          {selector('calendario', CalendarDays, 'Calendario')}
          {selector('lista', List, 'Lista')}
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">{rango(fechas)}</span>
        <DatosDeMuestra />
        {tieneRol(PUEDE_AGENDAR) && (
          <Boton icono={Plus} className="ml-auto" onClick={() => pedir('Agendar entrevista')}>
            Agendar entrevista
          </Boton>
        )}
      </div>

      {vista === 'calendario' ? (
        <section className="tarjeta relative mt-4 overflow-x-auto" aria-label="Calendario semanal de entrevistas" data-testid="calendario-semana">
          <div className="grid min-w-[860px] grid-cols-[4.5rem_repeat(5,minmax(0,1fr))]">
            <div className="border-b border-slate-200 bg-slate-50" />
            {DIAS.map((dia, i) => {
              const total = ENTREVISTAS.filter((e) => e.dia === i).length;
              return (
                <div
                  key={dia}
                  className={`border-b border-l border-slate-200 px-3 py-3 text-center ${i === hoy ? 'bg-primario text-white' : 'bg-slate-50 text-slate-900'}`}
                >
                  <p className="text-sm font-semibold">
                    {dia} {fechas[i].getDate()}
                    {i === hoy && <span className="sr-only"> (hoy)</span>}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-1.5 text-[11px] font-bold ${i === hoy ? 'bg-white/25' : 'bg-primario-suave text-primario'}`}>
                    {total}
                    <span className="sr-only"> entrevistas</span>
                  </span>
                </div>
              );
            })}

            {HORAS_ENTREVISTA.map((hora) => (
              <div key={hora} className="contents">
                <div className="border-b border-slate-100 px-3 py-4 text-right text-xs font-medium text-slate-500">{hora}</div>
                {DIAS.map((dia, i) => {
                  const e = ENTREVISTAS.find((x) => x.dia === i && x.hora === hora);
                  return (
                    <div key={dia} className={`min-h-[6.5rem] border-b border-l border-slate-100 p-2 ${i === hoy ? 'bg-primario-suave/60' : ''}`}>
                      {e && (
                        <article className="h-full rounded-lg border border-slate-200 bg-white p-2.5 shadow-tarjeta transition hover:border-primario/40 hover:shadow-md">
                          <div className="flex items-start gap-2">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${AVATAR[i]}`} aria-hidden>
                              {iniciales(e.candidato)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900" title={e.candidato}>
                                {e.candidato}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {e.cargo} · {e.tienda}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Estado e={e} />
                            <Resultado e={e} />
                          </div>
                        </article>
                      )}
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
                {ENTREVISTAS.map((e) => (
                  <tr key={e.candidato} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {DIAS[e.dia]} {fechas[e.dia].getDate()}
                      </p>
                      <p className="text-xs text-slate-500">{e.hora}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${AVATAR[e.dia]}`} aria-hidden>
                          {iniciales(e.candidato)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{e.candidato}</p>
                          <p className="text-xs text-slate-500">{e.cargo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{e.tienda}</td>
                    <td className="px-4 py-3">
                      <Estado e={e} />
                    </td>
                    <td className="px-4 py-3">{e.resultado ? <Resultado e={e} /> : <span className="text-xs text-slate-400">Sin evaluar</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {dialogo}
    </div>
  );
}
