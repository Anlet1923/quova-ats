import { Link } from 'react-router-dom';
import { Compass, ShieldAlert } from 'lucide-react';
import { EstadoVacio } from '../components/ui';

const ENLACE = 'inline-flex items-center rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro';

/** Estado «sin permisos»: el rol del usuario no permite abrir el módulo. */
export function SinAcceso() {
  return (
    <div className="tarjeta mx-auto max-w-xl">
      <EstadoVacio
        icono={ShieldAlert}
        titulo="No tienes acceso a este módulo"
        texto="Tu rol no permite realizar esta acción. Si crees que es un error, contacta al administrador del sistema."
        accion={
          <Link to="/dashboard" className={ENLACE}>
            Ir al dashboard
          </Link>
        }
      />
    </div>
  );
}

export function NoEncontrado() {
  return (
    <div className="tarjeta mx-auto max-w-xl">
      <EstadoVacio
        icono={Compass}
        titulo="No encontramos esta página"
        texto="El enlace puede estar incompleto o la página ya no existe."
        accion={
          <Link to="/dashboard" className={ENLACE}>
            Ir al dashboard
          </Link>
        }
      />
    </div>
  );
}
