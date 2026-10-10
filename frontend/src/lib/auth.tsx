import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, EVENTO_SESION_EXPIRADA, sesion } from './api';
import type { Rol, Usuario } from './tipos';

interface Auth {
  usuario: Usuario | null;
  /** Verdadero mientras se valida el token guardado al abrir la aplicación. */
  cargando: boolean;
  /** Verdadero cuando la sesión se cerró porque el token venció. */
  expirada: boolean;
  /** Verdadero tras «Cerrar sesión»: el siguiente usuario no debe volver a la pantalla del anterior. */
  salio: boolean;
  iniciarSesion: (correo: string, password: string) => Promise<Usuario>;
  cerrarSesion: () => void;
  tieneRol: (roles: Rol[]) => boolean;
}

const Contexto = createContext<Auth | null>(null);

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(Boolean(sesion.token));
  const [expirada, setExpirada] = useState(false);
  const [salio, setSalio] = useState(false);

  useEffect(() => {
    if (!sesion.token) return;
    api<Usuario>('/auth/me')
      .then(setUsuario)
      .catch(() => sesion.cerrar())
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const alExpirar = () => {
      sesion.cerrar();
      setUsuario((actual) => {
        if (actual) setExpirada(true);
        return null;
      });
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  const iniciarSesion = useCallback(async (correo: string, password: string) => {
    const respuesta = await api<{ token: string; usuario: Usuario }>('/auth/login', {
      method: 'POST',
      body: { correo, password },
      publico: true,
    });
    sesion.guardar(respuesta.token);
    setExpirada(false);
    setSalio(false);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  }, []);

  const cerrarSesion = useCallback(() => {
    sesion.cerrar();
    setExpirada(false);
    setSalio(true);
    setUsuario(null);
  }, []);

  const valor = useMemo<Auth>(
    () => ({
      usuario,
      cargando,
      expirada,
      salio,
      iniciarSesion,
      cerrarSesion,
      tieneRol: (roles) => Boolean(usuario && roles.includes(usuario.rol)),
    }),
    [usuario, cargando, expirada, salio, iniciarSesion, cerrarSesion],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): Auth {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth debe usarse dentro de ProveedorAuth');
  return contexto;
}
