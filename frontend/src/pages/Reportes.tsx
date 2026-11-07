import { useCallback, useEffect, useState } from 'react';
import { api, mensajeDe } from '../lib/api';
import { ETIQUETA_FUENTE, type Fuente, type ReporteFila, type Reportes as Datos } from '../lib/tipos';
import { ErrorDeCarga, Esqueleto } from '../components/ui';

function efectividad(fila: ReporteFila): string {
  if (!fila.postulaciones) return 'Sin datos';
  return `${Math.round((fila.contratados * 100) / fila.postulaciones)} %`;
}

function dias(fila: ReporteFila): string {
  return fila.dias == null ? 'Sin datos' : `${fila.dias} días`;
}

function Tabla({ titulo, texto, filas, fuente, tienda }: {
  titulo: string;
  texto: string;
  filas: ReporteFila[];
  fuente?: boolean;
  tienda?: boolean;
}) {
  return (
    <section className="tarjeta overflow-hidden" aria-label={titulo}>
      <div className="px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-900">{titulo}</h3>
        <p className="text-xs text-slate-500">{texto}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">{fuente ? 'Fuente' : tienda ? 'Tienda' : 'Cargo'}</th>
              <th scope="col" className="px-5 py-3 font-semibold">Postulaciones</th>
              <th scope="col" className="px-5 py-3 font-semibold">Contratados</th>
              <th scope="col" className="px-5 py-3 font-semibold">{fuente ? 'Efectividad' : 'Tiempo de contratación'}</th>
              {tienda && <th scope="col" className="px-5 py-3 font-semibold">Vacantes abiertas</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map((fila) => (
              <tr key={fila.nombre} className="hover:bg-slate-50/60">
                <td className="px-5 py-3.5 font-semibold text-slate-900">
                  {fuente ? ETIQUETA_FUENTE[fila.nombre as Fuente] ?? fila.nombre : fila.nombre}
                </td>
                <td className="px-5 py-3.5 tabular-nums text-slate-700">{fila.postulaciones}</td>
                <td className="px-5 py-3.5 tabular-nums text-slate-700">{fila.contratados}</td>
                <td className="px-5 py-3.5 text-slate-700">{fuente ? efectividad(fila) : dias(fila)}</td>
                {tienda && <td className="px-5 py-3.5 tabular-nums text-slate-700">{fila.vacantesAbiertas ?? 0}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Reportes() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setError(null);
    return api<Datos>('/reportes').then(setDatos).catch((e) => setError(mensajeDe(e)));
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (error) return <ErrorDeCarga mensaje={error} onReintentar={cargar} />;
  if (!datos) return <Esqueleto className="h-80" />;

  return (
    <div className="space-y-4">
      <Tabla titulo="Por fuente" texto="De cada 100 postulaciones, cuántas terminan contratadas." filas={datos.porFuente} fuente />
      <Tabla titulo="Por cargo" texto="Postulaciones, contratados y días promedio hasta la contratación." filas={datos.porCargo} />
      <Tabla titulo="Por tienda" texto="El jefe de tienda solo ve su sede." filas={datos.porTienda} tienda />
    </div>
  );
}
