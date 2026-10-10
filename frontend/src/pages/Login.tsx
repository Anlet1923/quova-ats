import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ShoppingBag } from 'lucide-react';
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
    `w-full rounded-lg border bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primario ${
      conError ? 'border-red-400' : 'border-white/20'
    }`;

  return (
    <div className="grid min-h-screen bg-marino text-white lg:grid-cols-[55%_45%]">
      <section className="relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#33469B] via-[#22357C] to-marino" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 2px, transparent 2px 64px)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-marino to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primario">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <div className="leading-tight">
              <p className="text-2xl font-bold">Quova</p>
              <p className="text-sm text-slate-300">Moda &amp; Calzado</p>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold leading-snug">
              El talento correcto,
              <br />
              en la tienda correcta.
            </p>
            <p className="mt-3 text-sm text-slate-300">Panel interno de reclutamiento · RR. HH.</p>
          </div>
        </div>
      </section>

      <main className="flex items-center justify-center px-6 py-12">
        <form onSubmit={enviar} noValidate className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario">
              <ShoppingBag className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-xl font-bold">Quova ATS</p>
          </div>

          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="mt-2 text-sm text-slate-300">Ingresa con tu cuenta corporativa para acceder al panel.</p>

          {expirada && !error && (
            <p role="status" className="mt-6 rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-100">
              Tu sesión expiró. Vuelve a iniciar sesión para continuar donde estabas.
            </p>
          )}

          {error && (
            <div role="alert" data-testid="login-error" className="mt-6 flex items-start gap-2 rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2.5 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">{error.bloqueada ? 'Cuenta bloqueada temporalmente' : 'No pudimos iniciar sesión'}</p>
                <p>{error.mensaje}</p>
              </div>
            </div>
          )}

          <div className="mt-6">
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
              <p id="correo-error" role="alert" className="mt-1.5 text-xs font-medium text-red-300">
                {errores.correo}
              </p>
            )}
          </div>

          <div className="mt-5">
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
              <p id="password-error" role="alert" className="mt-1.5 text-xs font-medium text-red-300">
                {errores.password}
              </p>
            )}
          </div>

          <Boton type="submit" ancho cargando={enviando} className="mt-7 !py-3 shadow-lg shadow-primario/30">
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </Boton>

          <p className="mt-8 text-center text-xs text-slate-300">
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
