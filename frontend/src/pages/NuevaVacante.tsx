import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, Copy, CreditCard, Home, Package, ShoppingBag, type LucideIcon } from 'lucide-react';
import { api, ApiError, mensajeDe } from '../lib/api';
import { useAuth } from '../lib/auth';
import { copiar } from '../lib/portapapeles';
import { useAvisos } from '../lib/toast';
import {
  ETIQUETA_TURNO,
  fechaCorta,
  HORARIO_TURNO,
  linkPostulacion,
  PUEDE_GESTIONAR_VACANTES,
  soles,
  type Cargo,
  type Tienda,
  type Turno,
  type Vacante,
} from '../lib/tipos';
import { Boton, Campo, Cargando, ErrorDeCarga, Etiqueta, MensajeError, Modal } from '../components/ui';
import { SinAcceso } from './Avisos';

const PASOS = ['Seleccionar cargo', 'Completar información', 'Publicar'];
const TURNOS: Turno[] = ['MANANA', 'TARDE', 'ROTATIVO', 'FIN_DE_SEMANA'];

const ESTILO_CARGO: { icono: LucideIcon; clase: string; texto: string }[] = [
  { icono: ShoppingBag, clase: 'bg-blue-50 text-blue-600', texto: 'text-blue-600' },
  { icono: CreditCard, clase: 'bg-cyan-50 text-cyan-600', texto: 'text-cyan-700' },
  { icono: Home, clase: 'bg-violet-50 text-violet-600', texto: 'text-violet-600' },
  { icono: Package, clase: 'bg-emerald-50 text-emerald-600', texto: 'text-emerald-700' },
];

interface Formulario {
  tiendaId: string;
  turno: Turno | '';
  puestos: string;
  salario: string;
  fechaCierre: string;
  urgente: boolean;
  descripcion: string;
  requisitos: string;
}

function isoLocal(fecha: Date): string {
  const d = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
}

function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoLocal(d);
}

function enDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return isoLocal(d);
}

export default function NuevaVacante() {
  const { tieneRol } = useAuth();
  const avisos = useAvisos();
  const navegar = useNavigate();

  const [paso, setPaso] = useState(0);
  const [cargos, setCargos] = useState<Cargo[] | null>(null);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [form, setForm] = useState<Formulario>({ tiendaId: '', turno: '', puestos: '1', salario: '', fechaCierre: enDias(21), urgente: false, descripcion: '', requisitos: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<'publicar' | 'borrador' | null>(null);
  const [duplicada, setDuplicada] = useState<{ id: number } | null>(null);
  const [publicada, setPublicada] = useState<Vacante | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargarCatalogos = () => {
    setErrorCarga(null);
    Promise.all([api<Cargo[]>('/cargos'), api<Tienda[]>('/tiendas')])
      .then(([c, t]) => {
        setCargos(c);
        setTiendas(t);
      })
      .catch((e) => setErrorCarga(mensajeDe(e)));
  };

  useEffect(cargarCatalogos, []);

  if (!tieneRol(PUEDE_GESTIONAR_VACANTES)) return <SinAcceso />;

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((actuales) => {
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  const elegirCargo = (c: Cargo) => {
    // La plantilla precarga salario, descripción y requisitos; si se cambia de cargo, se reemplazan
    if (cargo?.id !== c.id) {
      setForm((f) => ({ ...f, salario: String(c.salarioBase), descripcion: c.descripcion, requisitos: c.requisitos }));
    }
    setCargo(c);
    setPaso(1);
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.tiendaId) e.tiendaId = 'Elige la tienda de la vacante.';
    if (!form.turno) e.turno = 'Elige el turno.';
    if (!/^\d+$/.test(form.puestos) || Number(form.puestos) < 1) e.puestos = 'Indica al menos 1 puesto.';
    if (!form.salario || Number.isNaN(Number(form.salario)) || Number(form.salario) <= 0) e.salario = 'El salario debe ser mayor a cero.';
    if (!form.fechaCierre || form.fechaCierre < manana()) e.fechaCierre = 'La fecha de cierre debe ser posterior a hoy.';
    if (form.descripcion.length > 1000) e.descripcion = 'La descripción admite hasta 1000 caracteres.';
    if (form.requisitos.length > 1000) e.requisitos = 'Los requisitos admiten hasta 1000 caracteres.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = async (publicar: boolean, crearIgualmente = false) => {
    if (!cargo) return;
    setEnviando(publicar ? 'publicar' : 'borrador');
    try {
      const vacante = await api<Vacante>('/vacantes', {
        method: 'POST',
        body: {
          cargoId: cargo.id,
          tiendaId: Number(form.tiendaId),
          turno: form.turno,
          puestos: Number(form.puestos),
          salario: Number(form.salario),
          fechaCierre: form.fechaCierre,
          urgente: form.urgente,
          descripcion: form.descripcion,
          requisitos: form.requisitos,
          publicar,
          crearIgualmente,
        },
      });
      setDuplicada(null);
      if (publicar) {
        setPublicada(vacante);
        avisos.exito('La vacante se publicó y ya tiene su link único.');
      } else {
        avisos.exito('La vacante se guardó como borrador.');
        navegar('/vacantes?q=' + encodeURIComponent(vacante.cargo));
      }
    } catch (err) {
      if (err instanceof ApiError && err.codigo === 'VACANTE_DUPLICADA') {
        setDuplicada({ id: Number(err.datos.existenteId) });
      } else if (err instanceof ApiError && err.status === 400 && Object.keys(err.errores).length) {
        // El servidor volvió a validar: se regresa al paso 2 con el error junto a cada campo
        setErrores(err.errores);
        setPaso(1);
        avisos.error(err.message);
      } else {
        avisos.error(mensajeDe(err));
      }
    } finally {
      setEnviando(null);
    }
  };

  const copiarLink = async () => {
    if (!publicada?.token) return;
    if (await copiar(linkPostulacion(publicada.token))) {
      setCopiado(true);
      avisos.exito('Link de postulación copiado al portapapeles.');
    } else {
      avisos.error('No pudimos copiar el link. Selecciónalo y cópialo manualmente.');
    }
  };

  const tienda = tiendas.find((t) => String(t.id) === form.tiendaId);

  if (publicada?.token) {
    return (
      <div className="tarjeta mx-auto max-w-2xl p-8 text-center" data-testid="vacante-publicada">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Vacante publicada</h2>
        <p className="mt-1 text-sm text-slate-600">
          <strong>{publicada.titulo}</strong> ya está <Etiqueta tono="verde">Abierta</Etiqueta> y puede recibir postulaciones.
        </p>
        <label htmlFor="link-vacante" className="mt-6 block text-left text-sm font-medium text-slate-700">
          Link único de postulación
        </label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input id="link-vacante" readOnly value={linkPostulacion(publicada.token)} onFocus={(e) => e.target.select()} className="control font-mono text-xs" data-testid="link-vacante" />
          <Boton icono={copiado ? Check : Copy} onClick={copiarLink} className="shrink-0">
            {copiado ? 'Link copiado' : 'Copiar link'}
          </Boton>
        </div>
        <p className="mt-2 text-left text-xs text-slate-500">
          Publícalo en la web de Quova o en LinkedIn como «aplicación externa». Agrega <code>?fuente=linkedin</code> al final para registrar de dónde llega cada candidato.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Link to="/vacantes" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ver vacantes
          </Link>
          <Link to="/vacantes/nueva" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Crear otra vacante
          </Link>
          <Link to="/pipeline" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ir al pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/vacantes" className="inline-flex items-center gap-1 rounded hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" aria-hidden /> Vacantes
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-slate-900" aria-current="page">
          Nueva vacante
        </span>
      </nav>

      <ol className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Pasos para crear la vacante">
        {PASOS.map((nombre, i) => (
          <li key={nombre} className="flex items-center gap-2 text-sm" aria-current={i === paso ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                i < paso ? 'bg-emerald-600 text-white' : i === paso ? 'bg-primario text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i < paso ? <Check className="h-4 w-4" aria-label="Completado" /> : i + 1}
            </span>
            <span className={i === paso ? 'font-semibold text-slate-900' : 'text-slate-500'}>{nombre}</span>
            {i < PASOS.length - 1 && <span className="ml-2 hidden h-px w-10 bg-slate-300 sm:block" aria-hidden />}
          </li>
        ))}
      </ol>

      {errorCarga ? (
        <div className="tarjeta mt-6">
          <ErrorDeCarga mensaje={errorCarga} onReintentar={cargarCatalogos} />
        </div>
      ) : !cargos ? (
        <Cargando texto="Cargando plantillas…" />
      ) : paso === 0 ? (
        <section className="mt-6">
          <p className="text-sm text-slate-600">Elige el tipo de puesto para cargar la plantilla base y acelerar la publicación.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {cargos.map((c, i) => {
              const estilo = ESTILO_CARGO[i % ESTILO_CARGO.length];
              const elegido = cargo?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => elegirCargo(c)}
                  aria-pressed={elegido}
                  className={`tarjeta flex items-start gap-4 p-5 text-left transition hover:border-primario hover:shadow-md ${elegido ? 'border-primario ring-1 ring-primario' : ''}`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${estilo.clase}`}>
                    <estilo.icono className="h-6 w-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-slate-900">{c.nombre}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-slate-500">{c.descripcion}</span>
                    <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${estilo.texto}`}>
                      Salario base: {soles(c.salarioBase)}/mes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : paso === 1 ? (
        <form
          className="tarjeta mt-6 p-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (validar()) setPaso(2);
          }}
        >
          <p className="text-sm text-slate-600">
            Plantilla: <strong className="text-slate-900">{cargo?.nombre}</strong>. Revisa los datos precargados y completa los de esta vacante.
          </p>

          {Object.keys(errores).length > 1 && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Hay {Object.keys(errores).length} campos por corregir antes de continuar.
            </div>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Tienda" error={errores.tiendaId} ayuda="Solo se puede publicar en tiendas activas.">
              {(p) => (
                <select {...p} className={`control ${errores.tiendaId ? 'control-error' : ''}`} value={form.tiendaId} onChange={(e) => cambiar('tiendaId', e.target.value)}>
                  <option value="">Selecciona una tienda</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id} disabled={!t.activa}>
                      {t.nombre}
                      {t.activa ? '' : ' (inactiva)'}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Número de puestos" error={errores.puestos}>
              {(p) => (
                <input {...p} type="number" min={1} inputMode="numeric" className={`control ${errores.puestos ? 'control-error' : ''}`} value={form.puestos} onChange={(e) => cambiar('puestos', e.target.value)} />
              )}
            </Campo>

            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Turno</legend>
              <div className="grid gap-2 sm:grid-cols-4">
                {TURNOS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.turno === t}
                    onClick={() => cambiar('turno', t)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      form.turno === t ? 'border-primario bg-primario text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-primario'
                    }`}
                  >
                    <span className="block font-semibold">{ETIQUETA_TURNO[t]}</span>
                    <span className={`block text-xs ${form.turno === t ? 'text-blue-100' : 'text-slate-500'}`}>{HORARIO_TURNO[t]}</span>
                  </button>
                ))}
              </div>
              {errores.turno && <MensajeError>{errores.turno}</MensajeError>}
            </fieldset>

            <Campo etiqueta="Salario mensual (S/)" error={errores.salario} ayuda={cargo ? `Salario base del cargo: ${soles(cargo.salarioBase)}` : undefined}>
              {(p) => (
                <input {...p} type="number" min={1} step="50" inputMode="decimal" className={`control ${errores.salario ? 'control-error' : ''}`} value={form.salario} onChange={(e) => cambiar('salario', e.target.value)} />
              )}
            </Campo>

            <Campo etiqueta="Fecha de cierre" error={errores.fechaCierre} ayuda="Después de esta fecha el link deja de aceptar postulaciones.">
              {(p) => (
                <input {...p} type="date" min={manana()} className={`control ${errores.fechaCierre ? 'control-error' : ''}`} value={form.fechaCierre} onChange={(e) => cambiar('fechaCierre', e.target.value)} />
              )}
            </Campo>

            <div className="sm:col-span-2">
              <Campo etiqueta="Descripción del puesto" error={errores.descripcion}>
                {(p) => <textarea {...p} rows={3} className={`control ${errores.descripcion ? 'control-error' : ''}`} value={form.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />}
              </Campo>
            </div>
            <div className="sm:col-span-2">
              <Campo etiqueta="Requisitos" error={errores.requisitos}>
                {(p) => <textarea {...p} rows={3} className={`control ${errores.requisitos ? 'control-error' : ''}`} value={form.requisitos} onChange={(e) => cambiar('requisitos', e.target.value)} />}
              </Campo>
            </div>

            <label className="flex items-start gap-3 sm:col-span-2">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primario" checked={form.urgente} onChange={(e) => cambiar('urgente', e.target.checked)} />
              <span className="text-sm text-slate-700">
                Marcar como <strong>urgente</strong>
                <span className="block text-xs text-slate-500">Se destaca con la etiqueta URGENTE en el listado.</span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse justify-between gap-2 border-t border-slate-100 pt-5 sm:flex-row">
            <Boton variante="secundario" onClick={() => setPaso(0)}>
              Anterior
            </Boton>
            <Boton type="submit">Continuar a la vista previa</Boton>
          </div>
        </form>
      ) : (
        <section className="mt-6">
          <div className="tarjeta p-6" data-testid="vista-previa">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {cargo?.nombre} · {tienda?.nombre}
              </h2>
              {form.urgente && <Etiqueta tono="rojo">URGENTE</Etiqueta>}
              <Etiqueta tono="ambar">Vista previa</Etiqueta>
            </div>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Turno</dt>
                <dd className="font-semibold text-slate-900">{form.turno ? ETIQUETA_TURNO[form.turno] : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Puestos</dt>
                <dd className="font-semibold text-slate-900">{form.puestos}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Salario</dt>
                <dd className="font-semibold text-slate-900">{soles(Number(form.salario))}/mes</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Cierra el</dt>
                <dd className="font-semibold text-slate-900">{fechaCorta(form.fechaCierre)}</dd>
              </div>
            </dl>
            <h3 className="mt-5 text-sm font-semibold text-slate-900">Descripción</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{form.descripcion || 'Sin descripción.'}</p>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Requisitos</h3>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{form.requisitos || 'Sin requisitos.'}</p>
          </div>

          <div className="mt-4 flex flex-col-reverse justify-between gap-2 sm:flex-row">
            <Boton variante="secundario" onClick={() => setPaso(1)} disabled={enviando != null}>
              Anterior
            </Boton>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Boton variante="secundario" cargando={enviando === 'borrador'} disabled={enviando != null} onClick={() => guardar(false)}>
                Guardar borrador
              </Boton>
              <Boton cargando={enviando === 'publicar'} disabled={enviando != null} onClick={() => guardar(true)}>
                {enviando === 'publicar' ? 'Publicando…' : 'Publicar'}
              </Boton>
            </div>
          </div>
        </section>
      )}

      {duplicada && (
        <Modal
          titulo="Ya existe una vacante igual"
          onCerrar={() => setDuplicada(null)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => navegar(`/vacantes?q=${encodeURIComponent(`${cargo?.nombre ?? ''} ${tienda?.nombre ?? ''}`.trim())}`)}>
                Ver existente
              </Boton>
              <Boton cargando={enviando === 'publicar'} onClick={() => guardar(true, true)}>
                Crear igualmente
              </Boton>
            </>
          }
        >
          Hay una vacante <strong className="text-slate-900">abierta</strong> con el mismo cargo, tienda y turno ({cargo?.nombre} · {tienda?.nombre} ·{' '}
          {form.turno ? ETIQUETA_TURNO[form.turno] : ''}). Publicar otra puede dividir a los postulantes entre dos links.
        </Modal>
      )}
    </div>
  );
}
