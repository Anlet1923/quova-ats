import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  Kanban,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ETIQUETA_ROL, iniciales, PUEDE_GESTIONAR_VACANTES, type Dashboard, type Rol } from '../lib/tipos';

interface Item {
  ruta: string;
  nombre: string;
  icono: LucideIcon;
  /** Módulos del 60 % restante: se muestran en el menú, pero aún no están construidos. */
  proximamente?: boolean;
  roles?: Rol[];
  contador?: 'vacantesAbiertas' | 'candidatosActivos';
}

const MENU_PRINCIPAL: Item[] = [
  { ruta: '/dashboard', nombre: 'Dashboard', icono: LayoutGrid },
  { ruta: '/vacantes', nombre: 'Vacantes', icono: Briefcase, contador: 'vacantesAbiertas' },
  { ruta: '/pipeline', nombre: 'Pipeline', icono: Kanban, contador: 'candidatosActivos' },
  { ruta: '/entrevistas', nombre: 'Cal. Entrevistas', icono: CalendarDays, proximamente: true },
  { ruta: '/banco-talento', nombre: 'Banco de talento', icono: Archive, proximamente: true, roles: ['RECLUTADOR', 'ADMIN'] },
  { ruta: '/reportes', nombre: 'Reportes', icono: BarChart3, proximamente: true, roles: ['RECLUTADOR', 'ADMIN', 'GERENTE_REGIONAL'] },
];

const MENU_SISTEMA: Item[] = [
  { ruta: '/tiendas', nombre: 'Tiendas', icono: Store, proximamente: true },
  { ruta: '/configuracion', nombre: 'Configuración', icono: Settings, proximamente: true, roles: ['ADMIN'] },
];

const TITULOS: Record<string, [string, string]> = {
  '/dashboard': ['Dashboard', 'Resumen del reclutamiento de tiendas'],
  '/vacantes': ['Vacantes por tienda', 'Gestiona las posiciones abiertas en toda la cadena'],
  '/vacantes/nueva': ['Crear vacante', 'Usa una plantilla por cargo para publicar rápido'],
  '/pipeline': ['Pipeline de candidatos', 'Tablero kanban por etapa · arrastra las tarjetas o usa «Avanzar»'],
  '/entrevistas': ['Calendario de entrevistas', 'Módulo del siguiente avance'],
  '/banco-talento': ['Banco de talento', 'Módulo del siguiente avance'],
  '/reportes': ['Reportes', 'Módulo del siguiente avance'],
  '/tiendas': ['Gestión de tiendas', 'Módulo del siguiente avance'],
  '/configuracion': ['Configuración', 'Módulo del siguiente avance'],
};

export default function PanelLayout() {
  const { usuario, cerrarSesion, tieneRol } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [avisosAbiertos, setAvisosAbiertos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [contadores, setContadores] = useState<Record<string, string>>({});

  // Los contadores del menú se refrescan al cambiar de pantalla para reflejar lo que el usuario acaba de hacer
  useEffect(() => {
    setMenuAbierto(false);
    setAvisosAbiertos(false);
    api<Dashboard>('/dashboard')
      .then((d) => setContadores(Object.fromEntries(d.tarjetas.map((t) => [t.clave, t.valor]))))
      .catch(() => undefined);
  }, [ubicacion.pathname]);

  if (!usuario) return null;

  const [titulo, subtitulo] = TITULOS[ubicacion.pathname] ?? ['Quova ATS', ''];
  const visibles = (items: Item[]) => items.filter((i) => !i.roles || i.roles.includes(usuario.rol));

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    navegar(`/pipeline${busqueda.trim() ? `?q=${encodeURIComponent(busqueda.trim())}` : ''}`);
  };

  const enlace = (item: Item) => (
    <NavLink
      key={item.ruta}
      to={item.ruta}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-primario text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      <item.icono className="h-[18px] w-[18px] shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.nombre}</span>
        {item.proximamente && <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Próximamente</span>}
      </span>
      {item.contador && contadores[item.contador] && (
        <span className="rounded-full bg-primario px-2 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/20">{contadores[item.contador]}</span>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {menuAbierto && <div className="fixed inset-0 z-30 bg-marino/50 lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marino text-white transition-transform lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Quova ATS</p>
            <p className="text-xs text-slate-400">Moda &amp; Calzado · RR. HH.</p>
          </div>
          <button type="button" className="ml-auto rounded p-1 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menú del panel">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menú principal</p>
          {visibles(MENU_PRINCIPAL).map(enlace)}
          <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Sistema</p>
          {visibles(MENU_SISTEMA).map(enlace)}
        </nav>

        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marino-claro text-xs font-bold">{iniciales(usuario.nombre)}</span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold" data-testid="usuario-nombre">{usuario.nombre}</p>
            <p className="truncate text-xs text-slate-400">
              {ETIQUETA_ROL[usuario.rol]}
              {usuario.tienda ? ` · ${usuario.tienda}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              cerrarSesion();
              navegar('/login');
            }}
            className="rounded-md p-2 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <button type="button" className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-slate-900">{titulo}</h1>
          {subtitulo && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitulo}</p>}
        </div>

        <form onSubmit={buscar} role="search" className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar candidatos…"
            aria-label="Buscar candidatos por nombre"
            className="control w-56 !py-2 pl-9"
          />
        </form>

        <div className="relative">
          <button
            type="button"
            onClick={() => setAvisosAbiertos((v) => !v)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Notificaciones"
            aria-expanded={avisosAbiertos}
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          {avisosAbiertos && (
            <div className="tarjeta absolute right-0 mt-2 w-72 p-4 text-sm shadow-lg">
              <p className="font-semibold text-slate-900">Notificaciones</p>
              <p className="mt-1 text-slate-500">
                Los avisos por correo y WhatsApp llegarán en el siguiente avance. <span className="font-semibold text-slate-600">Próximamente.</span>
              </p>
            </div>
          )}
        </div>

        {tieneRol(PUEDE_GESTIONAR_VACANTES) && (
          <Link to="/vacantes/nueva" className="inline-flex items-center gap-2 rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-primario-oscuro">
            <Plus className="h-4 w-4" aria-hidden />
            <span>Nueva vacante</span>
          </Link>
        )}
      </header>

      <main className="px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
