export type Rol = 'ADMIN' | 'RECLUTADOR' | 'JEFE_TIENDA' | 'GERENTE_REGIONAL';
export type EstadoVacante = 'BORRADOR' | 'ABIERTA' | 'CERRADA';
export type Turno = 'MANANA' | 'TARDE' | 'ROTATIVO' | 'FIN_DE_SEMANA';
export type Etapa = 'NUEVO' | 'PRESELECCIONADO' | 'ENTREVISTA' | 'PRUEBA' | 'OFERTA' | 'CONTRATADO' | 'DESCARTADO';
export type Fuente = 'WEB_QUOVA' | 'LINKEDIN' | 'COMPUTRABAJO' | 'BUMERAN' | 'REFERIDO';
export type Inicio = 'INMEDIATA' | 'UNA_SEMANA' | 'DOS_SEMANAS' | 'UN_MES';
export type MotivoDescarte =
  | 'NO_CUMPLE_PERFIL'
  | 'NO_DISPONIBILIDAD_TURNO'
  | 'PRETENSION_SALARIAL'
  | 'NO_ASISTIO_ENTREVISTA'
  | 'DESISTIO'
  | 'NO_RESPONDE'
  | 'OTRO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  tiendaId: number | null;
  tienda: string | null;
}

export interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  distrito: string;
  activa: boolean;
}

export interface Cargo {
  id: number;
  nombre: string;
  salarioBase: number;
  descripcion: string;
  requisitos: string;
}

export interface Vacante {
  id: number;
  titulo: string;
  cargoId: number;
  cargo: string;
  tiendaId: number | null;
  tienda: string | null;
  turno: Turno | null;
  puestos: number | null;
  salario: number | null;
  fechaCierre: string | null;
  descripcion: string | null;
  requisitos: string | null;
  urgente: boolean;
  estado: EstadoVacante;
  token: string | null;
  creadaEn: string;
  candidatos: number;
}

export interface VacantePublica {
  token: string;
  titulo: string;
  cargo: string;
  tienda: string;
  distrito: string;
  direccion: string;
  turno: Turno;
  salario: number;
  descripcion: string;
  requisitos: string;
  fechaCierre: string;
}

export interface Candidato {
  id: number;
  nombre: string;
  celular: string;
  vacanteId: number;
  vacante: string;
  tiendaId: number | null;
  tienda: string | null;
  cargo: string;
  fuente: Fuente;
  etapa: Etapa;
  diasEnEtapa: number;
  etapaDesde: string;
  creadoEn: string;
  bancoTalento: boolean;
  motivoDescarte: MotivoDescarte | null;
}

export interface Historial {
  fecha: string;
  etapaOrigen: Etapa | null;
  etapaDestino: Etapa;
  usuario: string;
  comentario: string | null;
}

export interface Tarjeta {
  clave: string;
  titulo: string;
  valor: string;
  variacion: string;
  favorable: boolean | null;
  detalle: string;
}

export interface Serie {
  nombre: string;
  total: number;
}

export interface Dashboard {
  tarjetas: Tarjeta[];
  candidatosPorEtapa: Serie[];
  vacantesPorTienda: Serie[];
  periodo: string;
}

/** Etapas del tablero en orden; un candidato solo puede moverse hacia la derecha. */
export const ETAPAS: Etapa[] = ['NUEVO', 'PRESELECCIONADO', 'ENTREVISTA', 'PRUEBA', 'OFERTA', 'CONTRATADO'];

export const ETIQUETA_ETAPA: Record<Etapa, string> = {
  NUEVO: 'Nuevo',
  PRESELECCIONADO: 'Preseleccionado',
  ENTREVISTA: 'Entrevista',
  PRUEBA: 'Prueba',
  OFERTA: 'Oferta',
  CONTRATADO: 'Contratado',
  DESCARTADO: 'Descartado',
};

export const ETIQUETA_TURNO: Record<Turno, string> = {
  MANANA: 'Mañana',
  TARDE: 'Tarde',
  ROTATIVO: 'Rotativo',
  FIN_DE_SEMANA: 'Fines de semana',
};

export const HORARIO_TURNO: Record<Turno, string> = {
  MANANA: '7:00 a 15:00',
  TARDE: '14:00 a 22:00',
  ROTATIVO: 'Según programación',
  FIN_DE_SEMANA: 'Sábados y domingos',
};

export const ETIQUETA_FUENTE: Record<Fuente, string> = {
  WEB_QUOVA: 'Web Quova',
  LINKEDIN: 'LinkedIn',
  COMPUTRABAJO: 'Computrabajo',
  BUMERAN: 'Bumeran',
  REFERIDO: 'Referido',
};

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  RECLUTADOR: 'Reclutador(a) RR. HH.',
  JEFE_TIENDA: 'Jefe de tienda',
  GERENTE_REGIONAL: 'Gerente regional',
};

export const ETIQUETA_ESTADO: Record<EstadoVacante, string> = {
  BORRADOR: 'Borrador',
  ABIERTA: 'Abierta',
  CERRADA: 'Cerrada',
};

export const ETIQUETA_INICIO: Record<Inicio, string> = {
  INMEDIATA: 'De inmediato',
  UNA_SEMANA: 'En 1 semana',
  DOS_SEMANAS: 'En 2 semanas',
  UN_MES: 'En 1 mes',
};

export const ETIQUETA_MOTIVO: Record<MotivoDescarte, string> = {
  NO_CUMPLE_PERFIL: 'No cumple el perfil del puesto',
  NO_DISPONIBILIDAD_TURNO: 'No tiene disponibilidad para el turno',
  PRETENSION_SALARIAL: 'Pretensión salarial fuera del rango',
  NO_ASISTIO_ENTREVISTA: 'No asistió a la entrevista',
  DESISTIO: 'Desistió del proceso',
  NO_RESPONDE: 'No responde a los mensajes',
  OTRO: 'Otro motivo',
};

export const PUEDE_GESTIONAR_VACANTES: Rol[] = ['RECLUTADOR', 'ADMIN'];
export const PUEDE_MOVER_CANDIDATOS: Rol[] = ['RECLUTADOR'];

export function soles(monto: number | null | undefined): string {
  if (monto == null) return 'Por definir';
  return `S/ ${Number(monto).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const fecha = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

export function linkPostulacion(token: string): string {
  return `${window.location.origin}/postular/${token}`;
}
