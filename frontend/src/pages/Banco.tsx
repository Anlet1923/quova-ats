import { useEffect, useState } from 'react';
import { Archive, Search } from 'lucide-react';
import { api, mensajeDe } from '../lib/api';
import { ETIQUETA_FUENTE, ETIQUETA_MOTIVO, type Candidato } from '../lib/tipos';
import { ErrorDeCarga, Esqueleto, EstadoVacio, Etiqueta } from '../components/ui';

export default function Banco() {
  const [q, setQ] = useState('');
  const [intento, setIntento] = useState(0);
  const [lista, setLista] = useState<Candidato[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const espera = setTimeout(() => {
      setError(null);
      const consulta = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      api<Candidato[]>(`/banco${consulta}`)
        .then(setLista)
        .catch((e) => setError(mensajeDe(e)));
    }, 250);
    return () => clearTimeout(espera);
  }, [q, intento]);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, DNI o cargo…"
          aria-label="Buscar en el banco de talento"
          className="control pl-9"
        />
      </div>

      {error && <div className="mt-4"><ErrorDeCarga mensaje={error} onReintentar={() => setIntento((n) => n + 1)} /></div>}
      {!error && !lista && <Esqueleto className="mt-4 h-64" />}
      {lista && lista.length === 0 && (
        <div className="tarjeta mt-4">
          <EstadoVacio
            icono={Archive}
            titulo={q.trim() ? 'Sin coincidencias' : 'El banco está vacío'}
            texto={q.trim() ? 'Prueba con otro nombre, DNI o cargo.' : 'Los candidatos aparecen aquí cuando, al descartarlos, marcas «Guardar en banco de talento».'}
          />
        </div>
      )}
      {lista && lista.length > 0 && (
        <section className="tarjeta mt-4 overflow-hidden" aria-label="Candidatos del banco de talento">
          <p className="px-5 py-4 text-sm text-slate-500">{lista.length} {lista.length === 1 ? 'candidato guardado' : 'candidatos guardados'}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Candidato</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Cargo</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Tienda</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Motivo</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Fuente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lista.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{c.nombre}</p>
                      <p className="text-xs text-slate-500">{c.celular}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{c.cargo}</td>
                    <td className="px-5 py-3.5 text-slate-700">{c.tienda ?? 'Sin tienda'}</td>
                    <td className="px-5 py-3.5">
                      <Etiqueta tono="ambar">{c.motivoDescarte ? ETIQUETA_MOTIVO[c.motivoDescarte] : 'Sin motivo'}</Etiqueta>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{ETIQUETA_FUENTE[c.fuente]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
