const CLAVE_TOKEN = 'quova.token';

/** Evento que se emite cuando el backend responde 401 a una llamada del panel. */
export const EVENTO_SESION_EXPIRADA = 'quova:sesion-expirada';

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string,
    public errores: Record<string, string> = {},
    public datos: Record<string, unknown> = {},
  ) {
    super(mensaje);
  }

  /** Falla de red o del servidor: el usuario puede reintentar sin cambiar nada. */
  get esDeConexion() {
    return this.status === 0 || this.status >= 500;
  }
}

export const sesion = {
  get token() {
    return localStorage.getItem(CLAVE_TOKEN);
  },
  guardar(token: string) {
    localStorage.setItem(CLAVE_TOKEN, token);
  },
  cerrar() {
    localStorage.removeItem(CLAVE_TOKEN);
  },
};

interface Opciones {
  method?: 'GET' | 'POST';
  body?: unknown;
  form?: FormData;
  /** Llamada del portal o del login: no envía el token ni dispara el cierre de sesión. */
  publico?: boolean;
}

const SIN_CONEXION = 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.';

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (sesion.token && !opciones.publico) {
    headers.Authorization = `Bearer ${sesion.token}`;
  }
  let body: BodyInit | undefined;
  if (opciones.form) {
    body = opciones.form;
  } else if (opciones.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opciones.body);
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`/api${ruta}`, { method: opciones.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', SIN_CONEXION);
  }

  const texto = await respuesta.text();
  let datos: Record<string, unknown> | null = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !opciones.publico) {
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
    // Un 5xx sin cuerpo JSON suele ser el proxy avisando que el backend no está levantado
    const mensaje = (datos?.mensaje as string) ?? (respuesta.status >= 500 ? SIN_CONEXION : 'Ocurrió un error inesperado.');
    throw new ApiError(
      respuesta.status,
      (datos?.codigo as string) ?? 'ERROR',
      mensaje,
      (datos?.errores as Record<string, string>) ?? {},
      datos ?? {},
    );
  }
  return datos as T;
}

export function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';
}
