import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Ban, Briefcase, CircleCheck, Clock, Minus, Users, type LucideIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PUEDE_GESTIONAR_VACANTES, type Dashboard as Datos, type Tarjeta } from '../lib/tipos';
import { ErrorDeCarga, Esqueleto, EstadoVacio } from '../components/ui';

const ICONOS: Record<string, { icono: LucideIcon; clase: string }> = {
  vacantesAbiertas: { icono: Briefcase, clase: 'bg-blue-50 text-blue-600' },
  candidatosActivos: { icono: Users, clase: 'bg-cyan-50 text-cyan-600' },
  tiempoContratacion: { icono: Clock, clase: 'bg-violet-50 text-violet-600' },
  contratados: { icono: CircleCheck, clase: 'bg-emerald-50 text-emerald-600' },
  tasaAbandono: { icono: Ban, clase: 'bg-rose-50 text-rose-600' },
};

// Tonos de azul que se oscurecen al avanzar el proceso; «Contratado» va en verde (éxito)
const COLOR_ETAPA = ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8', '#059669'];
const COLOR_TIENDA = ['#2563EB', '#0891B2', '#7C3AED', '#059669', '#D97706', '#DB2777'];

function TarjetaIndicador({ tarjeta }: { tarjeta: Tarjeta }) {
  const { icono: Icono, clase } = ICONOS[tarjeta.clave] ?? ICONOS.vacantesAbiertas;
  const sube = tarjeta.variacion.startsWith('+');
  // El color depende de si el cambio es favorable, no de su signo; el texto lo dice también con palabras
  const tono = tarjeta.favorable == null ? 'text-slate-500' : tarjeta.favorable ? 'text-emerald-700' : 'text-red-600';
  const Flecha = tarjeta.favorable == null ? Minus : sube ? ArrowUp : ArrowDown;
  const lectura = tarjeta.favorable == null ? '' : tarjeta.favorable ? 'Favorable' : 'Desfavorable';
  return (
    <article className="tarjeta p-5" data-testid={`tarjeta-${tarjeta.clave}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${clase}`}>
        <Icono className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{tarjeta.valor}</p>
      <h3 className="mt-1 text-sm text-slate-500">{tarjeta.titulo}</h3>
      <p className={`mt-3 flex flex-wrap items-center gap-x-1 text-xs font-medium ${tono}`}>
        <Flecha className="h-3.5 w-3.5" aria-hidden />
        <span>{tarjeta.variacion}</span>
        {lectura && <span className="font-semibold">· {lectura}</span>}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{tarjeta.detalle}</p>
    </article>
  );
}

export default function Dashboard() {
  const { usuario, tieneRol } = useAuth();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    setDatos(null);
    api<Datos>('/dashboard')
      .then(setDatos)
      .catch((e) => setError(mensajeDe(e)));
  }, []);

  useEffect(cargar, [cargar]);

  if (error) {
    return (
      <div className="tarjeta">
        <ErrorDeCarga mensaje={error} onReintentar={cargar} />
      </div>
    );
  }

  if (!datos) {
    return (
      <div role="status" aria-label="Cargando el dashboard">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Esqueleto key={i} className="h-44" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <Esqueleto className="h-80 xl:col-span-2" />
          <Esqueleto className="h-80" />
        </div>
      </div>
    );
  }

  const totalCandidatos = datos.candidatosPorEtapa.reduce((suma, s) => suma + s.total, 0);
  const tiendasConVacantes = datos.vacantesPorTienda.filter((s) => s.total > 0);
  const totalVacantes = tiendasConVacantes.reduce((suma, s) => suma + s.total, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-600">
          Resumen del periodo{usuario?.tienda && usuario.rol === 'JEFE_TIENDA' ? ` · Tienda ${usuario.tienda}` : ' · Toda la cadena'}
        </h2>
        <span className="rounded-lg bg-primario px-3 py-1.5 text-xs font-semibold text-white">{datos.periodo}</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores principales">
        {datos.tarjetas.map((t) => (
          <TarjetaIndicador key={t.clave} tarjeta={t} />
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="tarjeta p-5 xl:col-span-2" aria-label="Candidatos por etapa">
          <h3 className="text-base font-semibold text-slate-900">Candidatos por etapa</h3>
          <p className="text-xs text-slate-500">{totalCandidatos} candidatos · en el orden del pipeline</p>
          {totalCandidatos === 0 ? (
            <EstadoVacio
              icono={Users}
              titulo="Aún no hay candidatos"
              texto="Cuando lleguen postulaciones verás aquí cuántas hay en cada etapa."
              accion={
                tieneRol(PUEDE_GESTIONAR_VACANTES) ? (
                  <Link to="/vacantes/nueva" className="rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white">
                    Crear vacante
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-4 h-72" data-testid="grafico-etapas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.candidatosPorEtapa} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="nombre" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748B' }} interval={0} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} formatter={(valor) => [`${valor} candidatos`, 'Total']} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56} label={{ position: 'top', fontSize: 12, fill: '#334155' }} isAnimationActive={false}>
                    {datos.candidatosPorEtapa.map((s, i) => (
                      <Cell key={s.nombre} fill={COLOR_ETAPA[i % COLOR_ETAPA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="tarjeta p-5" aria-label="Vacantes por tienda">
          <h3 className="text-base font-semibold text-slate-900">Vacantes por tienda</h3>
          <p className="text-xs text-slate-500">
            {totalVacantes} vacantes abiertas · {datos.vacantesPorTienda.length} sedes activas
          </p>
          {totalVacantes === 0 ? (
            <EstadoVacio icono={Briefcase} titulo="Sin vacantes abiertas" texto="Publica una vacante para empezar a recibir postulaciones." />
          ) : (
            <>
              <div className="mt-2 h-48" data-testid="grafico-tiendas">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tiendasConVacantes} dataKey="total" nameKey="nombre" innerRadius={50} outerRadius={78} paddingAngle={3} isAnimationActive={false}>
                      {tiendasConVacantes.map((s) => (
                        <Cell key={s.nombre} fill={COLOR_TIENDA[datos.vacantesPorTienda.findIndex((t) => t.nombre === s.nombre) % COLOR_TIENDA.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(valor, nombre) => [`${valor} vacantes`, nombre]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {datos.vacantesPorTienda.map((s, i) => (
                  <li key={s.nombre} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLOR_TIENDA[i % COLOR_TIENDA.length] }} aria-hidden />
                    <span className="flex-1 truncate text-slate-600">{s.nombre}</span>
                    <span className="font-semibold text-slate-900">{s.total}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
