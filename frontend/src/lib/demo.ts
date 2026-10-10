// Datos de muestra de los módulos que todavía no se conectan al backend.
// Son fijos: nada de este archivo se lee ni se guarda en la base de datos.
import type { Rol } from './tipos';

export interface EntrevistaDemo {
  /** Día de la semana en curso: 0 = lunes … 4 = viernes. */
  dia: number;
  hora: string;
  candidato: string;
  cargo: string;
  tienda: string;
  estado: 'Pendiente' | 'Completada';
  /** Evaluación del jefe de tienda; solo en entrevistas completadas. */
  resultado?: 'Aprobado' | 'En espera';
  estrellas?: number;
}

export const HORAS_ENTREVISTA = ['09:00', '10:00', '11:00', '15:00', '16:00'];

export const ENTREVISTAS: EntrevistaDemo[] = [
  { dia: 0, hora: '09:00', candidato: 'Kevin Ramos Soto', cargo: 'Cajero/a', tienda: 'San Isidro', estado: 'Completada', resultado: 'Aprobado', estrellas: 5 },
  { dia: 0, hora: '11:00', candidato: 'Bruno Vargas León', cargo: 'Encargado de local', tienda: 'Los Olivos', estado: 'Completada', resultado: 'En espera', estrellas: 3 },
  { dia: 1, hora: '10:00', candidato: 'Fiorella Gutiérrez Paz', cargo: 'Vendedor/a', tienda: 'Miraflores', estado: 'Pendiente' },
  { dia: 1, hora: '15:00', candidato: 'Mariana Flores Díaz', cargo: 'Vendedor/a', tienda: 'La Molina', estado: 'Pendiente' },
  { dia: 2, hora: '09:00', candidato: 'Andrea Salazar Luna', cargo: 'Vendedor/a', tienda: 'Miraflores', estado: 'Pendiente' },
  { dia: 2, hora: '11:00', candidato: 'Renzo Chávez Molina', cargo: 'Personal de almacén', tienda: 'Surco', estado: 'Pendiente' },
  { dia: 3, hora: '10:00', candidato: 'Sofía Navarro Cruz', cargo: 'Personal de almacén', tienda: 'Surco', estado: 'Pendiente' },
  { dia: 3, hora: '16:00', candidato: 'Luis Alberto Poma Ccori', cargo: 'Vendedor/a', tienda: 'Surco', estado: 'Pendiente' },
  { dia: 4, hora: '09:00', candidato: 'Valeria Castillo Ríos', cargo: 'Cajero/a', tienda: 'Miraflores', estado: 'Pendiente' },
  { dia: 4, hora: '15:00', candidato: 'Camila Torres Vega', cargo: 'Vendedor/a', tienda: 'La Molina', estado: 'Pendiente' },
];

export interface TiendaDemo {
  nombre: string;
  direccion: string;
  activa: boolean;
  jefe: string | null;
  vacantes: number;
}

export const TIENDAS: TiendaDemo[] = [
  { nombre: 'Miraflores', direccion: 'Av. Larco 345', activa: true, jefe: 'Luis Paredes', vacantes: 2 },
  { nombre: 'San Isidro', direccion: 'Av. Conquistadores 510', activa: true, jefe: 'Patricia Rojas', vacantes: 1 },
  { nombre: 'Surco', direccion: 'Av. Javier Prado Este 4200, Jockey Plaza', activa: true, jefe: 'Jorge Salinas', vacantes: 2 },
  { nombre: 'La Molina', direccion: 'Av. La Molina 1120', activa: true, jefe: 'Mónica Vega', vacantes: 1 },
  { nombre: 'Los Olivos', direccion: 'Av. Alfredo Mendiola 3698', activa: true, jefe: 'César Huerta', vacantes: 1 },
  { nombre: 'San Borja', direccion: 'Av. San Borja Sur 480', activa: false, jefe: null, vacantes: 0 },
];

export const USUARIOS_DEMO: { nombre: string; correo: string; rol: Rol; tienda: string | null; activo: boolean }[] = [
  { nombre: 'Ana Torres', correo: 'admin@quova.pe', rol: 'ADMIN', tienda: null, activo: true },
  { nombre: 'Rosa Villanueva', correo: 'gerente@quova.pe', rol: 'GERENTE_REGIONAL', tienda: null, activo: true },
  { nombre: 'Luis Paredes', correo: 'jefe.miraflores@quova.pe', rol: 'JEFE_TIENDA', tienda: 'Miraflores', activo: true },
  { nombre: 'Carla Mendoza', correo: 'reclutador@quova.pe', rol: 'RECLUTADOR', tienda: null, activo: true },
  { nombre: 'Usuario Inactivo', correo: 'inactivo@quova.pe', rol: 'RECLUTADOR', tienda: null, activo: false },
];

export const CARGOS_DEMO: { nombre: string; salario: number; vacantes: number; descripcion: string }[] = [
  { nombre: 'Vendedor/a', salario: 1250, vacantes: 4, descripcion: 'Atiende y asesora a los clientes en piso de venta y mantiene el orden del local.' },
  { nombre: 'Cajero/a', salario: 1200, vacantes: 3, descripcion: 'Registra las ventas en caja, realiza cobros y efectúa el arqueo al cierre del turno.' },
  { nombre: 'Encargado de local', salario: 2100, vacantes: 1, descripcion: 'Lidera al equipo de la tienda, organiza los turnos y responde por los resultados.' },
  { nombre: 'Personal de almacén', salario: 1100, vacantes: 1, descripcion: 'Recibe, ordena y despacha la mercadería; apoya en inventarios y reposición.' },
];

/** Plantillas de comunicación de los momentos clave del proceso (sección 6.1 del informe). */
export const PLANTILLAS_DEMO: { nombre: string; canal: string; momento: string; mensaje: string }[] = [
  {
    nombre: 'Confirmación de postulación',
    canal: 'WhatsApp',
    momento: 'Al recibir la postulación',
    mensaje: 'Hola {nombre}, recibimos tu postulación a {cargo} en Quova {tienda}. Te escribiremos si tu perfil avanza.',
  },
  {
    nombre: 'Cita a entrevista',
    canal: 'WhatsApp y correo',
    momento: 'Al agendar la entrevista',
    mensaje: 'Hola {nombre}, te esperamos el {fecha} a las {hora} en Quova {tienda} para tu entrevista. Responde SÍ para confirmar.',
  },
  {
    nombre: 'Resultado del proceso',
    canal: 'WhatsApp',
    momento: 'Al cerrar la evaluación',
    mensaje: 'Hola {nombre}, gracias por participar en el proceso de {cargo}. Ya tenemos el resultado de tu evaluación: {resultado}.',
  },
  {
    nombre: 'Bienvenida',
    canal: 'Correo',
    momento: 'Al pasar a «Contratado»',
    mensaje: '¡Bienvenido(a) a Quova, {nombre}! Tu primer día es el {fecha} en la tienda {tienda}. Pregunta por {jefe}.',
  },
];
