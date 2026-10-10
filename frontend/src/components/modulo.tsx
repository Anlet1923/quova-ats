import { useState, type ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { Boton, Etiqueta, Modal } from './ui';

/** Marca visible de los módulos que aún no leen ni guardan en la base de datos. */
export function DatosDeMuestra() {
  return (
    <Etiqueta tono="ambar" title="Este módulo aún no lee ni guarda en la base de datos">
      <FlaskConical className="h-3 w-3" aria-hidden /> Datos de muestra
    </Etiqueta>
  );
}

const TONO_CIFRA = {
  azul: 'bg-blue-50 text-blue-600',
  verde: 'bg-emerald-50 text-emerald-600',
  violeta: 'bg-violet-50 text-violet-600',
};

/** Cifra resumen de la cabecera de un módulo: el número va dentro del recuadro de color. */
export function Cifra({ valor, texto, tono = 'azul' }: { valor: ReactNode; texto: string; tono?: keyof typeof TONO_CIFRA }) {
  return (
    <div className="tarjeta flex items-center gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-titulo text-xl font-semibold ${TONO_CIFRA[tono]}`}>{valor}</span>
      <p className="text-sm font-medium text-slate-600">{texto}</p>
    </div>
  );
}

/** Los botones de estos módulos se muestran como en el prototipo, pero su acción llega en el siguiente avance. */
export function useAccionPendiente() {
  const [accion, setAccion] = useState<string | null>(null);
  const dialogo = accion ? (
    <Modal titulo={accion} onCerrar={() => setAccion(null)} pie={<Boton onClick={() => setAccion(null)}>Entendido</Boton>}>
      Esta acción forma parte del siguiente avance. Por ahora la pantalla solo muestra datos de muestra y no guarda cambios.
    </Modal>
  ) : null;
  return { pedir: setAccion, dialogo };
}
