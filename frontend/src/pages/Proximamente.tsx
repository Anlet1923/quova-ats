import { Link } from 'react-router-dom';
import { Archive, BarChart3, CalendarDays, Hourglass, Settings, Store, type LucideIcon } from 'lucide-react';
import { Etiqueta } from '../components/ui';

interface Info {
  icono: LucideIcon;
  titulo: string;
  peso: string;
  alcance: string[];
}

/** Módulos del 60 % restante: visibles en el menú para mostrar el alcance completo, aún sin construir. */
const MODULOS: Record<string, Info> = {
  entrevistas: {
    icono: CalendarDays,
    titulo: 'Calendario de entrevistas',
    peso: '12 % + 8 %',
    alcance: [
      'Agendar y reprogramar entrevistas, con aviso de cruce de horario.',
      'Vista de calendario y vista de lista.',
      'Evaluación del jefe de tienda: calificación, resultado y comentario.',
    ],
  },
  'banco-talento': {
    icono: Archive,
    titulo: 'Banco de talento y ficha del candidato',
    peso: '5 %',
    alcance: [
      'Ficha completa del candidato con sus respuestas y su CV.',
      'Búsqueda de candidatos guardados para nuevas vacantes.',
    ],
  },
  reportes: {
    icono: BarChart3,
    titulo: 'Reportes y vista del gerente regional',
    peso: '7 %',
    alcance: ['Efectividad por fuente de reclutamiento.', 'Tiempo de contratación por cargo y por tienda.', 'Alertas de vacantes críticas o vencidas.'],
  },
  tiendas: {
    icono: Store,
    titulo: 'Gestión de tiendas',
    peso: '5 %',
    alcance: ['Crear, editar, activar y desactivar tiendas.', 'Bloqueo de la desactivación si la tienda tiene vacantes abiertas.'],
  },
  configuracion: {
    icono: Settings,
    titulo: 'Configuración',
    peso: '8 %',
    alcance: ['Invitar usuarios y asignar roles.', 'Mantener el catálogo de cargos.', 'Plantillas de vacante y de mensajes.'],
  },
};

export default function Proximamente({ modulo }: { modulo: keyof typeof MODULOS }) {
  const info = MODULOS[modulo];
  return (
    <div className="tarjeta mx-auto max-w-2xl p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primario-suave text-primario">
          <info.icono className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{info.titulo}</h2>
            <Etiqueta tono="ambar">
              <Hourglass className="h-3 w-3" aria-hidden /> Próximamente
            </Etiqueta>
          </div>
          <p className="mt-1 text-sm text-slate-500">
           PROXIMAMENTE
          </p>
        </div>
      </div>


      <Link to="/dashboard" className="mt-8 inline-flex rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro">
        Volver al dashboard
      </Link>
    </div>
  );
}
