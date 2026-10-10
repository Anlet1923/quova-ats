import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, CalendarX, Check, CheckCircle2, FileText, Link2Off, Upload, UserCheck, WifiOff, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { ETIQUETA_INICIO, ETIQUETA_TURNO, HORARIO_TURNO, type Inicio, type Turno, type VacantePublica } from '../lib/tipos';
import { Boton, Campo, Cargando, MensajeError } from '../components/ui';
import { ENLACE_PRIMARIO, ENLACE_SECUNDARIO, MarcoPortal, PantallaEstado } from './Marco';

type Estado = 'cargando' | 'formulario' | 'noEncontrada' | 'cerrada' | 'duplicada' | 'cerradaDurante' | 'errorCarga' | 'errorEnvio' | 'exito';

interface Datos {
  nombre: string;
  dni: string;
  celular: string;
  correo: string;
  distrito: string;
  inicio: Inicio | '';
  turnos: Turno[];
  experienciaRetail: boolean | null;
  tiempoExperiencia: string;
  motivacion: string;
  atencionAfluencia: string;
  otrosLocales: boolean | null;
  consentimiento: boolean;
}

type Errores = Partial<Record<keyof Datos | 'cv', string>>;

const INICIAL: Datos = {
  nombre: '',
  dni: '',
  celular: '',
  correo: '',
  distrito: '',
  inicio: '',
  turnos: [],
  experienciaRetail: null,
  tiempoExperiencia: '',
  motivacion: '',
  atencionAfluencia: '',
  otrosLocales: null,
  consentimiento: false,
};

const PASOS = ['Datos personales', 'Disponibilidad', 'Cuestionario rápido', 'CV y envío'];
const CAMPOS_POR_PASO: (keyof Datos | 'cv')[][] = [
  ['nombre', 'dni', 'celular', 'correo', 'distrito'],
  ['inicio', 'turnos', 'experienciaRetail', 'tiempoExperiencia'],
  ['motivacion', 'atencionAfluencia', 'otrosLocales'],
  ['cv', 'consentimiento'],
];
const INICIOS: Inicio[] = ['INMEDIATA', 'UNA_SEMANA', 'DOS_SEMANAS', 'UN_MES'];
const TURNOS: Turno[] = ['MANANA', 'TARDE', 'ROTATIVO', 'FIN_DE_SEMANA'];
const TIEMPOS = ['Menos de 6 meses', '6 meses a 1 año', '1 a 2 años', 'Más de 2 años'];
const DISTRITOS = [
  'Ate', 'Barranco', 'Breña', 'Callao', 'Carabayllo', 'Chorrillos', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria',
  'Lima Cercado', 'Lince', 'Los Olivos', 'Magdalena del Mar', 'Miraflores', 'Pueblo Libre', 'Puente Piedra', 'Rímac', 'San Borja', 'San Isidro',
  'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santiago de Surco', 'Surquillo',
  'Villa El Salvador', 'Villa María del Triunfo', 'Otro distrito',
];
const MAX_CV = 10 * 1024 * 1024;
const MENSAJE_CV = 'Solo se aceptan PDF o Word de hasta 10 MB. Puedes enviar sin CV.';
const MIN_RESPUESTA = 20;

/** Mismas reglas que valida el backend, para mostrar el error junto al campo antes de enviar. */
function validar(campo: keyof Datos, d: Datos): string | undefined {
  switch (campo) {
    case 'nombre':
      if (!d.nombre.trim()) return 'Escribe tu nombre y apellido.';
      return /^[\p{L}'.-]+(\s+[\p{L}'.-]+)+$/u.test(d.nombre.trim()) ? undefined : 'Escribe tu nombre y apellido (solo letras).';
    case 'dni':
      return /^\d{8}$/.test(d.dni) ? undefined : 'El DNI debe tener 8 dígitos numéricos.';
    case 'celular':
      return /^9\d{8}$/.test(d.celular) ? undefined : 'Ingresa un celular de 9 dígitos que empiece con 9.';
    case 'correo':
      return !d.correo.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo.trim()) ? undefined : 'Revisa el formato del correo (ej.: juan@correo.com).';
    case 'distrito':
      return d.distrito ? undefined : 'Indica tu distrito de residencia.';
    case 'inicio':
      return d.inicio ? undefined : 'Indica cuándo puedes empezar.';
    case 'turnos':
      return d.turnos.length ? undefined : 'Elige al menos un turno.';
    case 'experienciaRetail':
      return d.experienciaRetail == null ? 'Indica si tienes experiencia en retail.' : undefined;
    case 'tiempoExperiencia':
      return d.experienciaRetail && !d.tiempoExperiencia ? 'Cuéntanos cuánto tiempo de experiencia tienes.' : undefined;
    case 'motivacion':
    case 'atencionAfluencia':
      return d[campo].trim().length >= MIN_RESPUESTA ? undefined : `Cuéntanos un poco más (mínimo ${MIN_RESPUESTA} caracteres).`;
    case 'otrosLocales':
      return d.otrosLocales == null ? 'Indica si puedes trabajar en otros locales.' : undefined;
    case 'consentimiento':
      return d.consentimiento ? undefined : 'Para enviar, acepta el tratamiento de tus datos.';
  }
}

function Opcion({ activa, onClick, children, multiple }: { activa: boolean; onClick: () => void; children: ReactNode; multiple?: boolean }) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={activa}
      onClick={onClick}
      className={`flex min-h-[48px] w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
        activa ? 'border-primario bg-primario text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-primario'
      }`}
    >
      <span>{children}</span>
      {activa && <Check className="h-4 w-4 shrink-0" aria-hidden />}
    </button>
  );
}

export default function Postular() {
  const { token = '' } = useParams();
  const [params] = useSearchParams();
  const fuente = params.get('fuente') ?? 'WEB_QUOVA';

  const [estado, setEstado] = useState<Estado>('cargando');
  const [vacante, setVacante] = useState<VacantePublica | null>(null);
  const [cerrada, setCerrada] = useState<{ vacante?: string; tienda?: string }>({});
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<Datos>(INICIAL);
  const [cv, setCv] = useState<File | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [avisoPaso, setAvisoPaso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const archivo = useRef<HTMLInputElement>(null);

  const cargarVacante = useCallback(() => {
    setEstado('cargando');
    api<VacantePublica>(`/public/vacantes/${token}`, { publico: true })
      .then((v) => {
        setVacante(v);
        setEstado('formulario');
      })
      .catch((e) => {
        const error = e instanceof ApiError ? e : null;
        if (error?.status === 410) {
          setCerrada({ vacante: error.datos.vacante as string, tienda: error.datos.tienda as string });
          setEstado('cerrada');
        } else if (error?.status === 404) {
          setEstado('noEncontrada');
        } else {
          setEstado('errorCarga');
        }
      });
  }, [token]);

  useEffect(cargarVacante, [cargarVacante]);

  // Al cambiar de paso o de pantalla, el foco va al título para que el lector de pantalla anuncie dónde está el usuario
  useEffect(() => {
    window.scrollTo({ top: 0 });
    titulo.current?.focus();
  }, [paso, estado]);

  const cambiar = <K extends keyof Datos>(campo: K, valor: Datos[K]) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  /** El formato se valida al salir del campo. */
  const alSalir = (campo: keyof Datos) => setErrores((e) => ({ ...e, [campo]: validar(campo, datos) }));

  const validarPaso = (indice: number): Errores => {
    const encontrados: Errores = {};
    for (const campo of CAMPOS_POR_PASO[indice]) {
      if (campo === 'cv') continue;
      const error = validar(campo, datos);
      if (error) encontrados[campo] = error;
    }
    return encontrados;
  };

  const irAlPasoConError = (encontrados: Errores) => {
    const indice = CAMPOS_POR_PASO.findIndex((campos) => campos.some((c) => encontrados[c]));
    if (indice >= 0) setPaso(indice);
  };

  const siguiente = async (e: FormEvent) => {
    e.preventDefault();
    setAvisoPaso(null);
    const encontrados = validarPaso(paso);
    setErrores((actuales) => ({ ...actuales, ...Object.fromEntries(CAMPOS_POR_PASO[paso].map((c) => [c, encontrados[c]])), cv: actuales.cv }));
    if (Object.keys(encontrados).length) return;

    if (paso === 0) {
      // El DNI se verifica al terminar el paso 1 para no hacer llenar todo el formulario a quien ya postuló
      setOcupado(true);
      try {
        await api(`/public/vacantes/${token}/verificar-dni?dni=${datos.dni}`, { publico: true });
      } catch (err) {
        const error = err instanceof ApiError ? err : null;
        if (error?.status === 409) setEstado('duplicada');
        else if (error?.status === 410) setEstado('cerradaDurante');
        else if (error?.status === 400 && error.errores.dni) setErrores((x) => ({ ...x, dni: error.errores.dni }));
        else setAvisoPaso('No pudimos verificar tu DNI. Revisa tu conexión y vuelve a pulsar «Siguiente». Tus datos siguen aquí.');
        return;
      } finally {
        setOcupado(false);
      }
    }
    setPaso((p) => p + 1);
  };

  const adjuntar = (seleccionado: File | undefined) => {
    if (!seleccionado) return;
    const extension = seleccionado.name.toLowerCase().split('.').pop() ?? '';
    if (!['pdf', 'doc', 'docx'].includes(extension) || seleccionado.size > MAX_CV) {
      // El archivo inválido no se adjunta y el resto del formulario queda intacto
      setCv(null);
      setErrores((e) => ({ ...e, cv: MENSAJE_CV }));
    } else {
      setCv(seleccionado);
      setErrores((e) => ({ ...e, cv: undefined }));
    }
    if (archivo.current) archivo.current.value = '';
  };

  const enviar = async () => {
    const encontrados: Errores = { ...validarPaso(0), ...validarPaso(1), ...validarPaso(2), ...validarPaso(3) };
    if (Object.keys(encontrados).length) {
      setErrores(encontrados);
      irAlPasoConError(encontrados);
      setEstado('formulario');
      return;
    }
    setOcupado(true);
    try {
      const form = new FormData();
      const cuerpo = {
        ...datos,
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim() || null,
        tiempoExperiencia: datos.experienciaRetail ? datos.tiempoExperiencia : null,
      };
      form.append('datos', new Blob([JSON.stringify(cuerpo)], { type: 'application/json' }));
      if (cv) form.append('cv', cv);
      await api(`/public/vacantes/${token}/postulaciones?fuente=${encodeURIComponent(fuente)}`, { method: 'POST', form, publico: true });
      setEstado('exito');
    } catch (err) {
      const error = err instanceof ApiError ? err : null;
      if (error?.status === 409) {
        setEstado('duplicada');
      } else if (error?.status === 410) {
        setEstado('cerradaDurante');
      } else if (error && (error.status === 400 || error.status === 413) && Object.keys(error.errores).length) {
        const delServidor = error.errores as Errores;
        setErrores(delServidor);
        if (delServidor.cv) setCv(null);
        irAlPasoConError(delServidor);
        setEstado('formulario');
      } else {
        setEstado('errorEnvio');
      }
    } finally {
      setOcupado(false);
    }
  };

  const otrasVacantes = (
    <Link to="/postular" className={ENLACE_PRIMARIO}>
      Ver otras vacantes de Quova
    </Link>
  );

  if (estado === 'cargando') {
    return (
      <MarcoPortal>
        <Cargando texto="Cargando la vacante…" />
      </MarcoPortal>
    );
  }

  if (estado === 'noEncontrada') {
    return (
      <MarcoPortal>
        <PantallaEstado icono={Link2Off} tono="gris" titulo="Este link no es válido" testid="estado-no-encontrada" acciones={otrasVacantes}>
          <p>Puede estar incompleto o haber sido reemplazado. Revisa las vacantes que tenemos abiertas.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'errorCarga') {
    return (
      <MarcoPortal>
        <PantallaEstado icono={WifiOff} tono="rojo" titulo="No pudimos cargar la vacante" testid="estado-error-carga" acciones={<Boton ancho onClick={cargarVacante}>Reintentar</Boton>}>
          <p>Revisa tu conexión a internet e inténtalo otra vez.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'cerrada') {
    return (
      <MarcoPortal>
        <PantallaEstado icono={CalendarX} tono="gris" titulo="Vacante cerrada" testid="estado-vacante-cerrada" acciones={otrasVacantes}>
          <p>
            La vacante{cerrada.vacante ? <strong> {cerrada.vacante} · {cerrada.tienda}</strong> : ''} ya no recibe postulaciones.
          </p>
          <p>Tenemos otras vacantes abiertas que pueden interesarte.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'duplicada') {
    return (
      <MarcoPortal>
        <PantallaEstado icono={UserCheck} tono="ambar" titulo="Ya postulaste a esta vacante" testid="estado-duplicada" acciones={otrasVacantes}>
          <p>
            Ya registramos una postulación con el DNI <strong>{datos.dni}</strong> para <strong>{vacante?.cargo} · {vacante?.tienda}</strong>.
          </p>
          <p>No necesitas volver a enviarla: el equipo de RR. HH. te contactará si avanzas en el proceso. Sí puedes postular a otras vacantes.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'cerradaDurante') {
    return (
      <MarcoPortal>
        <PantallaEstado icono={CalendarX} tono="ambar" titulo="La vacante se cerró mientras postulabas" testid="estado-cerrada-durante" acciones={otrasVacantes}>
          <p>
            <strong>{vacante?.cargo} · {vacante?.tienda}</strong> dejó de recibir postulaciones hace un momento, por eso no pudimos registrar la tuya.
          </p>
          <p>Lamentamos el inconveniente. Mira las otras vacantes abiertas de Quova.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'errorEnvio') {
    return (
      <MarcoPortal>
        <PantallaEstado
          icono={WifiOff}
          tono="rojo"
          titulo="No pudimos enviar tu postulación"
          testid="estado-error-envio"
          acciones={
            <>
              <Boton ancho cargando={ocupado} onClick={enviar} className="!py-3">
                {ocupado ? 'Enviando…' : 'Reintentar'}
              </Boton>
              <Boton ancho variante="secundario" disabled={ocupado} onClick={() => setEstado('formulario')} className="!py-3">
                Volver al formulario
              </Boton>
            </>
          }
        >
          <p>Parece un problema de conexión. Tus datos siguen guardados en esta pantalla: no tienes que escribirlos otra vez.</p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  if (estado === 'exito') {
    return (
      <MarcoPortal>
        <PantallaEstado
          icono={CheckCircle2}
          tono="verde"
          titulo="¡Postulación enviada con éxito!"
          testid="estado-exito"
          acciones={
            <Link to="/postular" className={ENLACE_SECUNDARIO}>
              Ver otras vacantes de Quova
            </Link>
          }
        >
          <p>
            Gracias, <strong>{datos.nombre.trim().split(/\s+/)[0]}</strong>. Recibimos tu postulación a <strong>{vacante?.cargo} · {vacante?.tienda}</strong>.
          </p>
          <p>
            Si tu perfil avanza, te escribiremos o llamaremos al <strong>{datos.celular}</strong>. No necesitas hacer nada más.
          </p>
        </PantallaEstado>
      </MarcoPortal>
    );
  }

  const erroresDelPaso = CAMPOS_POR_PASO[paso].filter((c) => errores[c]);
  const clase = (campo: keyof Datos) => `control !py-3 !text-base ${errores[campo] ? 'control-error' : ''}`;

  return (
    <MarcoPortal>
      <div className="tarjeta flex items-start gap-3 border-primario/30 bg-primario-suave p-4" data-testid="tarjeta-vacante">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primario" aria-hidden />
        <p className="text-sm text-slate-700">
          <span className="block text-xs font-semibold uppercase tracking-wide text-primario">Postulando a:</span>
          <strong className="text-slate-900">{vacante?.cargo}</strong> · Tienda {vacante?.tienda}
          <span className="block text-xs text-slate-500">
            Turno {vacante ? ETIQUETA_TURNO[vacante.turno].toLowerCase() : ''} · {vacante?.direccion}
          </span>
        </p>
      </div>

      <div className="mt-5" role="group" aria-label={`Paso ${paso + 1} de ${PASOS.length}`}>
        <div className="flex gap-1.5" aria-hidden>
          {PASOS.map((nombre, i) => (
            <span key={nombre} className={`h-1.5 flex-1 rounded-full ${i < paso ? 'bg-emerald-500' : i === paso ? 'bg-primario' : 'bg-slate-200'}`} />
          ))}
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500" data-testid="indicador-paso">
          Paso {paso + 1} de {PASOS.length}
        </p>
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-bold text-slate-900 !ring-0 !ring-offset-0">
          {PASOS[paso]}
        </h1>
      </div>

      <form onSubmit={paso < 3 ? siguiente : (e) => { e.preventDefault(); enviar(); }} noValidate className="mt-4 space-y-5">
        {erroresDelPaso.length > 1 && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" data-testid="resumen-errores">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Revisa {erroresDelPaso.length} campos marcados en rojo para continuar.
          </div>
        )}
        {avisoPaso && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {avisoPaso}
          </div>
        )}

        {paso === 0 && (
          <>
            <Campo etiqueta="Nombre completo" error={errores.nombre}>
              {(p) => <input {...p} name="nombre" autoComplete="name" placeholder="Ej.: María Pérez Soto" className={clase('nombre')} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} onBlur={() => alSalir('nombre')} />}
            </Campo>
            <Campo etiqueta="DNI (8 dígitos)" error={errores.dni}>
              {(p) => (
                <input {...p} name="dni" inputMode="numeric" maxLength={8} placeholder="Ej.: 71234567" className={clase('dni')} value={datos.dni} onChange={(e) => cambiar('dni', e.target.value.replace(/\D/g, ''))} onBlur={() => alSalir('dni')} />
              )}
            </Campo>
            <Campo etiqueta="Celular (9 dígitos)" error={errores.celular} ayuda="Te contactaremos por WhatsApp o llamada a este número.">
              {(p) => (
                <input {...p} name="celular" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={9} placeholder="Ej.: 987654321" className={clase('celular')} value={datos.celular} onChange={(e) => cambiar('celular', e.target.value.replace(/\D/g, ''))} onBlur={() => alSalir('celular')} />
              )}
            </Campo>
            <Campo etiqueta="Correo electrónico" opcional error={errores.correo}>
              {(p) => <input {...p} name="correo" type="email" inputMode="email" autoComplete="email" placeholder="Ej.: maria@correo.com" className={clase('correo')} value={datos.correo} onChange={(e) => cambiar('correo', e.target.value)} onBlur={() => alSalir('correo')} />}
            </Campo>
            <Campo etiqueta="Distrito de residencia" error={errores.distrito}>
              {(p) => (
                <select {...p} name="distrito" className={clase('distrito')} value={datos.distrito} onChange={(e) => cambiar('distrito', e.target.value)}>
                  <option value="">Selecciona tu distrito</option>
                  {DISTRITOS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              )}
            </Campo>
          </>
        )}

        {paso === 1 && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">¿Cuándo puedes empezar?</legend>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {INICIOS.map((i) => (
                  <Opcion key={i} activa={datos.inicio === i} onClick={() => cambiar('inicio', i)}>
                    {ETIQUETA_INICIO[i]}
                  </Opcion>
                ))}
              </div>
              {errores.inicio && <MensajeError>{errores.inicio}</MensajeError>}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">
                Turnos en los que puedes trabajar <span className="font-normal text-slate-500">(puedes elegir varios)</span>
              </legend>
              <div className="space-y-2">
                {TURNOS.map((t) => (
                  <Opcion key={t} multiple activa={datos.turnos.includes(t)} onClick={() => cambiar('turnos', datos.turnos.includes(t) ? datos.turnos.filter((x) => x !== t) : [...datos.turnos, t])}>
                    {ETIQUETA_TURNO[t]} <span className="font-normal opacity-80">· {HORARIO_TURNO[t]}</span>
                  </Opcion>
                ))}
              </div>
              {errores.turnos && <MensajeError>{errores.turnos}</MensajeError>}
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">¿Tienes experiencia en tiendas (retail)?</legend>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                <Opcion activa={datos.experienciaRetail === true} onClick={() => cambiar('experienciaRetail', true)}>
                  Sí
                </Opcion>
                <Opcion
                  activa={datos.experienciaRetail === false}
                  onClick={() => {
                    setDatos((d) => ({ ...d, experienciaRetail: false, tiempoExperiencia: '' }));
                    setErrores((e) => ({ ...e, experienciaRetail: undefined, tiempoExperiencia: undefined }));
                  }}
                >
                  No
                </Opcion>
              </div>
              {errores.experienciaRetail && <MensajeError>{errores.experienciaRetail}</MensajeError>}
            </fieldset>

            {/* Solo se pregunta el tiempo de experiencia a quien respondió «Sí» */}
            {datos.experienciaRetail === true && (
              <fieldset data-testid="tiempo-experiencia">
                <legend className="mb-2 text-sm font-medium text-slate-700">¿Cuánto tiempo de experiencia tienes?</legend>
                <div role="radiogroup" className="grid grid-cols-2 gap-2">
                  {TIEMPOS.map((t) => (
                    <Opcion key={t} activa={datos.tiempoExperiencia === t} onClick={() => cambiar('tiempoExperiencia', t)}>
                      {t}
                    </Opcion>
                  ))}
                </div>
                {errores.tiempoExperiencia && <MensajeError>{errores.tiempoExperiencia}</MensajeError>}
              </fieldset>
            )}
          </>
        )}

        {paso === 2 && (
          <>
            {(['motivacion', 'atencionAfluencia'] as const).map((campo) => (
              <Campo
                key={campo}
                etiqueta={campo === 'motivacion' ? '1. ¿Por qué te interesa trabajar en Quova?' : '2. ¿Cómo atiendes a los clientes cuando hay mucha gente en la tienda?'}
                error={errores[campo]}
                ayuda={`${datos[campo].trim().length} de ${MIN_RESPUESTA} caracteres como mínimo`}
              >
                {(p) => <textarea {...p} name={campo} rows={4} maxLength={600} className={clase(campo)} value={datos[campo]} onChange={(e) => cambiar(campo, e.target.value)} onBlur={() => alSalir(campo)} />}
              </Campo>
            ))}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">3. ¿Puedes trabajar en más de un local de Quova?</legend>
              <div role="radiogroup" className="space-y-2">
                <Opcion activa={datos.otrosLocales === true} onClick={() => cambiar('otrosLocales', true)}>
                  Sí, otros locales
                </Opcion>
                <Opcion activa={datos.otrosLocales === false} onClick={() => cambiar('otrosLocales', false)}>
                  No, solo este local
                </Opcion>
              </div>
              {errores.otrosLocales && <MensajeError>{errores.otrosLocales}</MensajeError>}
            </fieldset>
          </>
        )}

        {paso === 3 && (
          <>
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Currículum (CV) <span className="font-normal text-slate-400">(opcional)</span>
              </p>
              {cv ? (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3" data-testid="cv-adjunto">
                  <FileText className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{cv.name}</p>
                    <p className="text-xs text-slate-500">{(cv.size / 1024 / 1024).toFixed(1)} MB · Archivo adjunto</p>
                  </div>
                  <button type="button" onClick={() => setCv(null)} className="rounded p-1 text-slate-500 hover:bg-white" aria-label="Quitar el CV adjunto">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="cv"
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center focus-within:ring-2 focus-within:ring-primario ${
                    errores.cv ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-primario'
                  }`}
                >
                  <Upload className="h-6 w-6 text-slate-400" aria-hidden />
                  <span className="text-sm font-semibold text-primario">Subir mi CV</span>
                  <span className="text-xs text-slate-500">PDF o Word, hasta 10 MB</span>
                </label>
              )}
              <input ref={archivo} id="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" aria-describedby="cv-ayuda" onChange={(e) => adjuntar(e.target.files?.[0])} />
              {errores.cv && <MensajeError>{errores.cv}</MensajeError>}
              <p id="cv-ayuda" className="mt-1.5 text-xs text-slate-500">
                Si no tienes un archivo CV, no te preocupes: usaremos los datos que ya registraste.
              </p>
            </div>

            <div>
              <label className={`flex items-start gap-3 rounded-lg border bg-white p-4 ${errores.consentimiento ? 'border-red-400' : 'border-slate-200'}`}>
                <input
                  type="checkbox"
                  name="consentimiento"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300"
                  checked={datos.consentimiento}
                  onChange={(e) => cambiar('consentimiento', e.target.checked)}
                />
                <span className="text-sm text-slate-700">
                  Autorizo a Quova a tratar mis datos personales para este proceso de selección, conforme a la <strong>Ley N.º 29733</strong>, Ley de Protección de Datos Personales.
                </span>
              </label>
              {errores.consentimiento && <MensajeError>{errores.consentimiento}</MensajeError>}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 pt-1">
          {paso < 3 ? (
            <Boton type="submit" ancho cargando={ocupado} className="!py-3 !text-base">
              {ocupado ? 'Verificando…' : 'Siguiente'}
            </Boton>
          ) : (
            <>
              <Boton type="submit" ancho cargando={ocupado} disabled={!datos.consentimiento} aria-describedby="ayuda-envio" className="!py-3 !text-base">
                {ocupado ? 'Enviando…' : 'Enviar postulación'}
              </Boton>
              {!datos.consentimiento && (
                <p id="ayuda-envio" className="text-center text-xs text-slate-500">
                  Para enviar, acepta el tratamiento de tus datos.
                </p>
              )}
            </>
          )}
          {paso > 0 && (
            <Boton variante="secundario" ancho disabled={ocupado} onClick={() => setPaso((p) => p - 1)} className="!py-3 !text-base">
              Anterior
            </Boton>
          )}
        </div>
      </form>
    </MarcoPortal>
  );
}
