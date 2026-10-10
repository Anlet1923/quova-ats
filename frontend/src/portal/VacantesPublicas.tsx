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
      <h1 className="text-xl font-bold text-slate-900">Vacantes abiertas en Quova</h1>
      <p className="mt-1 text-sm text-slate-600">Elige una vacante y postula en menos de 5 minutos, sin crear una cuenta.</p>

      {error ? (
        <div className="mt-5">
          <PantallaEstado icono={Briefcase} tono="rojo" titulo="No pudimos cargar las vacantes" testid="estado-error-carga" acciones={<Boton ancho onClick={cargar}>Reintentar</Boton>}>
            <p>{error}</p>
          </PantallaEstado>
        </div>
      ) : vacantes == null ? (
        <div className="mt-5 space-y-3" role="status" aria-label="Cargando vacantes">
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} className="h-24" />
          ))}
        </div>
      ) : vacantes.length === 0 ? (
        <div className="mt-5">
          <PantallaEstado icono={Briefcase} tono="gris" titulo="Por ahora no hay vacantes abiertas" testid="estado-sin-vacantes">
            <p>Vuelve a visitarnos pronto: publicamos nuevas vacantes cada semana.</p>
          </PantallaEstado>
        </div>
      ) : (
        <ul className="mt-5 space-y-3" data-testid="lista-vacantes">
          {vacantes.map((v) => (
            <li key={v.token}>
              <Link to={`/postular/${v.token}`} className="tarjeta flex items-center gap-3 p-4 hover:border-primario">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{v.cargo}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> Tienda {v.tienda}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {ETIQUETA_TURNO[v.turno]}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {soles(v.salario)}/mes · Postula hasta el {fechaCorta(v.fechaCierre)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </MarcoPortal>
  );
}
