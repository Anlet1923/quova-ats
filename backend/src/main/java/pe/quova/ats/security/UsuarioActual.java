package pe.quova.ats.security;

import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Usuario;

/** Usuario autenticado que viaja en el contexto de seguridad. */
public record UsuarioActual(Long id, String nombre, String correo, Rol rol, Long tiendaId) {

	public static UsuarioActual de(Usuario u) {
		return new UsuarioActual(u.getId(), u.getNombre(), u.getCorreo(), u.getRol(),
				u.getTienda() != null ? u.getTienda().getId() : null);
	}

	/** El jefe de tienda solo ve su local; los demás roles no tienen restricción (nulo). */
	public Long tiendaRestringida() {
		return rol == Rol.JEFE_TIENDA ? tiendaId : null;
	}
}
