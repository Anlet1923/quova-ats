import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, Clock, MapPin } from 'lucide-react';
import { api, mensajeDe } from '../lib/api';
import { ETIQUETA_TURNO, fechaCorta, soles, type VacantePublica } from '../lib/tipos';
import { Boton, Esqueleto } from '../components/ui';
import { MarcoPortal, PantallaEstado } from './Marco';

/** Listado público de vacantes abiertas: destino del enlace «Ver otras vacantes». */
export default function VacantesPublicas() {
  const [vacantes, setVacantes] = useState<VacantePublica[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    setVacantes(null);
    api<VacantePublica[]>('/public/vacantes', { publico: true })
      .then(setVacantes)
      .catch((e) => setError(mensajeDe(e)));
  }, []);

  useEffect(cargar, [cargar]);

  return (
    <MarcoPortal>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Vacantes abiertas en Quova</h1>
          <p className="mt-1.5 text-sm text-slate-600">Elige una vacante y postula en menos de 5 minutos, sin crear una cuenta.</p>
        </div>
        {vacantes && vacantes.length > 0 && (
          <p className="text-sm font-medium text-slate-500" role="status">
            {vacantes.length} {vacantes.length === 1 ? 'vacante disponible' : 'vacantes disponibles'}
          </p>
        )}
      </div>

      {error ? (
        <div>
          <PantallaEstado icono={Briefcase} tono="rojo" titulo="No pudimos cargar las vacantes" testid="estado-error-carga" acciones={<Boton ancho onClick={cargar}>Reintentar</Boton>}>
            <p>{error}</p>
          </PantallaEstado>
        </div>
      ) : vacantes == null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Cargando vacantes">
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </div>
      ) : vacantes.length === 0 ? (
        <div>
          <PantallaEstado icono={Briefcase} tono="gris" titulo="Por ahora no hay vacantes abiertas" testid="estado-sin-vacantes">
            <p>Vuelve a visitarnos pronto: publicamos nuevas vacantes cada semana.</p>
          </PantallaEstado>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="lista-vacantes">
          {vacantes.map((v) => (
            <li key={v.token}>
              <Link to={`/postular/${v.token}`} className="tarjeta group flex h-full items-center gap-3 p-4 shadow-md shadow-marino/5 transition hover:border-primario hover:shadow-lg">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg bg-primario-suave text-primario">
                  <Briefcase className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{v.cargo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden /> Tienda {v.tienda}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden /> {ETIQUETA_TURNO[v.turno]}
                    </span>
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-slate-500">
                    <span className="whitespace-nowrap">
                      <span className="text-sm font-semibold text-slate-900">{soles(v.salario)}</span>/mes
                    </span>
                    <span className="whitespace-nowrap">Postula hasta el {fechaCorta(v.fechaCierre)}</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primario" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MarcoPortal>
  );
}
