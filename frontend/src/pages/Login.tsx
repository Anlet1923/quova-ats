import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShoppingBag } from 'lucide-react';
import fondoTienda from '../assets/login-tienda.jpg';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Boton } from '../components/ui';

const DOMINIO = /^[\w.+-]+@quova\.pe$/i;

export default function Login() {
  const { usuario, iniciarSesion, expirada } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? '/dashboard';

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState<{ correo?: string; password?: string }>({});
  const [error, setError] = useState<{ mensaje: string; bloqueada: boolean } | null>(null);
  const [ayuda, setAyuda] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={desde} replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const nuevos: typeof errores = {};
    if (!correo.trim()) nuevos.correo = 'Ingresa tu correo corporativo.';
    else if (!DOMINIO.test(correo.trim())) nuevos.correo = 'Usa tu correo corporativo @quova.pe.';
    if (!password) nuevos.password = 'Ingresa tu contraseña.';
    setErrores(nuevos);
    setError(null);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await iniciarSesion(correo.trim(), password);
      navegar(desde, { replace: true });
    } catch (err) {
      const api = err instanceof ApiError ? err : null;
      if (api?.status === 400 && Object.keys(api.errores).length) {
        setErrores(api.errores);
      } else {
        setError({ mensaje: api?.message ?? 'No pudimos iniciar sesión. Inténtalo otra vez.', bloqueada: api?.codigo === 'CUENTA_BLOQUEADA' });
      }
      // La contraseña se limpia; el correo se conserva para no volver a escribirlo
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  const claseCampo = (conError?: string) =>
    `w-full rounded-lg border bg-white/5 py-3 pl-10 pr-10 text-sm text-white transition-colors placeholder:text-slate-400 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primario ${
      conError ? 'border-red-400' : 'border-white/20 hover:border-white/40 focus:border-primario'
    }`;

  return (
    // El anillo de foco se separa con el color del fondo oscuro, no con blanco
    <div className="grid min-h-screen bg-marino text-white lg:grid-cols-[55%_45%] [&_*]:ring-offset-marino">
      <section className="relative hidden overflow-hidden lg:block" aria-hidden>
        <img src={fondoTienda} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* Sombreado sobre la foto: da contraste al texto y separa este panel del formulario */}
        <div className="absolute inset-0 bg-marino/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-marino via-marino/40 to-marino/60" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-10 w-10" strokeWidth={1.75} />
            <div className="leading-tight">
              <p className="text-2xl font-bold">Quova</p>
              <p className="text-sm text-slate-300">Moda &amp; Calzado</p>
            </div>
          </div>
          <div className="max-w-md motion-safe:animate-entrada">
            <p className="font-titulo text-4xl font-semibold leading-tight tracking-tight">
              El talento correcto,
              <br />
              en la tienda correcta.
            </p>
            <p className="mt-4 text-sm text-slate-200">Panel interno de reclutamiento · RR. HH.</p>
          </div>
        </div>
      </section>

      <main className="flex items-center justify-center bg-marino px-6 py-12 lg:border-l lg:border-white/10">
        <form onSubmit={enviar} noValidate className="w-full max-w-sm motion-safe:animate-entrada">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <ShoppingBag className="h-8 w-8" strokeWidth={1.75} aria-hidden />
            <p className="text-xl font-bold">Quova ATS</p>
          </div>

          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="mt-3 text-sm text-slate-300">Ingresa con tu cuenta corporativa para acceder al panel.</p>

          {/* Proximidad: 8 px dentro de cada campo, 28 px entre campos y 40 px entre bloques */}
          {expirada && !error && (
            <p role="status" className="mt-8 rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-100">
              Tu sesión expiró. Vuelve a iniciar sesión para continuar donde estabas.
            </p>
          )}

          {error && (
            <div role="alert" data-testid="login-error" className="mt-8 flex items-start gap-2 rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2.5 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">{error.bloqueada ? 'Cuenta bloqueada temporalmente' : 'No pudimos iniciar sesión'}</p>
                <p>{error.mensaje}</p>
              </div>
            </div>
          )}

          <div className="mt-10">
            <label htmlFor="correo" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-200">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="correo"
                type="email"
                autoComplete="username"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@quova.pe"
                aria-invalid={Boolean(errores.correo)}
                aria-describedby={errores.correo ? 'correo-error' : undefined}
                className={claseCampo(errores.correo)}
              />
            </div>
            {errores.correo && (
              <p id="correo-error" role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-300">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{errores.correo}</span>
              </p>
            )}
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-200">
                Contraseña
              </label>
              <button type="button" onClick={() => setAyuda(true)} className="rounded text-xs font-semibold text-blue-300 hover:text-blue-200">
                ¿La olvidaste?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                id="password"
                type={verPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(errores.password)}
                aria-describedby={errores.password ? 'password-error' : undefined}
                className={claseCampo(errores.password)}
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-white"
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errores.password && (
              <p id="password-error" role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-300">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{errores.password}</span>
              </p>
            )}
          </div>

          <Boton type="submit" ancho cargando={enviando} className="mt-10 !py-3.5 shadow-lg shadow-primario/30 transition-shadow hover:shadow-primario/50">
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </Boton>

          <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-300">
            ¿Problemas de acceso?{' '}
            <button type="button" onClick={() => setAyuda(true)} className="rounded font-semibold text-blue-300 hover:text-blue-200">
              Contacta a TI
            </button>
          </p>
          {ayuda && (
            <p role="status" className="mt-3 rounded-lg bg-white/5 px-3 py-2.5 text-center text-xs text-slate-200">
              Escribe a <span className="font-semibold">soporte.ti@quova.pe</span> para recuperar tu acceso. La recuperación en línea llegará en el siguiente avance.
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
