import { useEffect, useLayoutEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  CalendarDays,
  Kanban,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ENTREVISTAS } from '../lib/demo';
import { useTema } from '../lib/tema';
import { ETIQUETA_ROL, iniciales, PUEDE_GESTIONAR_VACANTES, type Dashboard, type Rol } from '../lib/tipos';

interface Item {
  ruta: string;
  nombre: string;
  icono: LucideIcon;
  roles?: Rol[];
  contador?: 'vacantesAbiertas' | 'candidatosActivos';
  /** Contador de un módulo con datos de muestra, que no sale del dashboard. */
  fijo?: number;
}

const MENU_PRINCIPAL: Item[] = [
  { ruta: '/dashboard', nombre: 'Dashboard', icono: LayoutGrid },
  { ruta: '/vacantes', nombre: 'Vacantes', icono: Briefcase, contador: 'vacantesAbiertas' },
  { ruta: '/pipeline', nombre: 'Pipeline', icono: Kanban, contador: 'candidatosActivos' },
  { ruta: '/entrevistas', nombre: 'Cal. Entrevistas', icono: CalendarDays, fijo: ENTREVISTAS.filter((e) => e.estado === 'Pendiente').length },
];

const MENU_SISTEMA: Item[] = [
  { ruta: '/tiendas', nombre: 'Tiendas', icono: Store },
  { ruta: '/configuracion', nombre: 'Configuración', icono: Settings, roles: ['ADMIN'] },
];

const TITULOS: Record<string, [string, string]> = {
  '/dashboard': ['Dashboard', 'Resumen del reclutamiento de tiendas'],
  '/vacantes': ['Vacantes por tienda', 'Gestiona las posiciones abiertas en toda la cadena'],
  '/vacantes/nueva': ['Crear vacante', 'Usa una plantilla por cargo para publicar rápido'],
  '/pipeline': ['Pipeline de candidatos', 'Tablero kanban por etapa · arrastra las tarjetas o usa «Avanzar»'],
  '/entrevistas': ['Calendario de entrevistas', 'Agenda y seguimiento de entrevistas por tienda'],
  '/tiendas': ['Gestión de tiendas', 'Administra sedes, encargados y cuotas de personal'],
  '/configuracion': ['Configuración', 'Usuarios, roles, notificaciones y parámetros del sistema'],
};

export default function PanelLayout() {
  const { usuario, cerrarSesion, tieneRol } = useAuth();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [avisosAbiertos, setAvisosAbiertos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [contadores, setContadores] = useState<Record<string, string>>({});
  const { oscuro, alternar } = useTema();

  // El tema se aplica solo mientras el panel está en pantalla: el login y el portal conservan su diseño
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('oscuro', oscuro);
    return () => document.documentElement.classList.remove('oscuro');
  }, [oscuro]);

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
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isActive ? 'bg-primario font-semibold text-white shadow-md shadow-primario/20' : 'font-medium text-slate-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => {
        const contador = item.contador ? contadores[item.contador] : item.fijo;
        return (
          <>
            {/* El módulo activo va en azul, el color de «elemento activo» en todo el sistema */}
            <item.icono className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{item.nombre}</span>
            {contador ? (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums text-white ${isActive ? 'bg-white/25' : 'bg-primario'}`}>{contador}</span>
            ) : null}
          </>
        );
      }}
    </NavLink>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      {menuAbierto && <div className="fixed inset-0 z-30 bg-marino/50 lg:hidden" onClick={() => setMenuAbierto(false)} aria-hidden />}

      <aside
        className={`tema-claro fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-gradient-to-b from-marino to-marino-oscuro text-white transition-transform lg:translate-x-0 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 pb-5 pt-6">
          <ShoppingBag className="h-8 w-8 shrink-0" strokeWidth={1.75} aria-hidden />
          <div className="leading-tight">
            <p className="font-titulo text-lg font-semibold tracking-tight">Quova ATS</p>
            <p className="text-xs text-slate-400">Moda &amp; Calzado · RR. HH.</p>
          </div>
          <button type="button" className="ml-auto rounded p-1 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Menú del panel">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Menú principal</p>
          {visibles(MENU_PRINCIPAL).map(enlace)}
          <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Sistema</p>
          {visibles(MENU_SISTEMA).map(enlace)}
        </nav>

        <div className="m-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primario text-xs font-bold">{iniciales(usuario.nombre)}</span>
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
            className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
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
          <h1 className="truncate text-xl font-semibold text-slate-900">{titulo}</h1>
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

        <button
          type="button"
          onClick={alternar}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
          aria-pressed={oscuro}
          title={oscuro ? 'Modo claro' : 'Modo oscuro'}
          data-testid="boton-tema"
        >
          {oscuro ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

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
