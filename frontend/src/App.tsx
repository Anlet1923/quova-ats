import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Cargando } from './components/ui';
import PanelLayout from './layout/PanelLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vacantes from './pages/Vacantes';
import NuevaVacante from './pages/NuevaVacante';
import Pipeline from './pages/Pipeline';
import Entrevistas from './pages/Entrevistas';
import Tiendas from './pages/Tiendas';
import Configuracion from './pages/Configuracion';
import { NoEncontrado } from './pages/Avisos';
import Postular from './portal/Postular';
import VacantesPublicas from './portal/VacantesPublicas';

function RutaPrivada() {
  const { usuario, cargando, salio } = useAuth();
  const ubicacion = useLocation();
  if (cargando) return <Cargando texto="Validando tu sesión…" />;
  // Si la sesión expiró se recuerda la pantalla para volver a ella; tras un cierre voluntario, no
  if (!usuario) return <Navigate to="/login" replace state={salio ? null : { desde: ubicacion.pathname + ubicacion.search }} />;
  return <PanelLayout />;
}

/** La clave de navegación reinicia el asistente si se pulsa «+ Nueva vacante» estando ya en esa pantalla. */
function RutaNuevaVacante() {
  const { key } = useLocation();
  return <NuevaVacante key={key} />;
}

export default function App() {
  return (
    <Routes>
      {/* Portal público: el candidato no tiene cuenta */}
      <Route path="/postular" element={<VacantesPublicas />} />
      <Route path="/postular/:token" element={<Postular />} />

      <Route path="/login" element={<Login />} />

      {/* Panel interno */}
      <Route element={<RutaPrivada />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vacantes" element={<Vacantes />} />
        <Route path="/vacantes/nueva" element={<RutaNuevaVacante />} />
        <Route path="/pipeline" element={<Pipeline />} />
        {/* Módulos con datos de muestra: todavía no consultan el backend */}
        <Route path="/entrevistas" element={<Entrevistas />} />
        <Route path="/tiendas" element={<Tiendas />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
