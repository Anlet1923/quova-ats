package pe.quova.ats.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.CargoDto;
import pe.quova.ats.dto.Dtos.CargoRequest;
import pe.quova.ats.dto.Dtos.UsuarioDto;
import pe.quova.ats.dto.Dtos.UsuarioRequest;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Cargo;
import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Tienda;
import pe.quova.ats.model.Usuario;
import pe.quova.ats.repo.CargoRepository;
import pe.quova.ats.repo.TiendaRepository;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.security.UsuarioActual;

@Service
@RequiredArgsConstructor
public class ConfiguracionService {

	private final UsuarioRepository usuarios;
	private final CargoRepository cargos;
	private final TiendaRepository tiendas;
	private final PasswordEncoder encoder;

	@Transactional(readOnly = true)
	public List<UsuarioDto> usuarios() {
		return usuarios.findAllByOrderByNombreAsc().stream().map(ConfiguracionService::aDto).toList();
	}

	@Transactional
	public UsuarioDto crearUsuario(UsuarioRequest req) {
		String correo = correo(req);
		if (usuarios.existsByCorreoIgnoreCase(correo)) {
			throw duplicadoUsuario();
		}
		if (req.password() == null || req.password().isBlank()) {
			throw ApiException.datosInvalidos("Revisa los campos marcados.").conError("password",
					"Ingresa una contraseña de al menos 8 caracteres.");
		}
		Usuario u = Usuario.builder().nombre(req.nombre().trim()).correo(correo).passwordHash(encoder.encode(req.password()))
				.rol(req.rol()).tienda(tienda(req)).activo(req.activo() == null || req.activo()).build();
		return aDto(usuarios.save(u));
	}

	@Transactional
	public UsuarioDto actualizarUsuario(Long id, UsuarioRequest req, UsuarioActual actual) {
		Usuario u = usuarios.findById(id).orElseThrow(() -> ApiException.noEncontrado("El usuario no existe."));
		String correo = correo(req);
		if (usuarios.existsByCorreoIgnoreCaseAndIdNot(correo, id)) {
			throw duplicadoUsuario();
		}
		boolean activo = req.activo() == null || req.activo();
		if (u.getId().equals(actual.id()) && !activo) {
			throw new ApiException(HttpStatus.CONFLICT, "NO_PUEDES_DESACTIVARTE", "No puedes desactivar tu propia cuenta.");
		}
		if (u.getRol() == Rol.ADMIN && u.isActivo() && (req.rol() != Rol.ADMIN || !activo)
				&& usuarios.findByRolAndActivoTrue(Rol.ADMIN).stream().noneMatch(otro -> !otro.getId().equals(id))) {
			throw new ApiException(HttpStatus.CONFLICT, "ULTIMO_ADMIN", "Debe quedar al menos un administrador activo.");
		}
		u.setNombre(req.nombre().trim());
		u.setCorreo(correo);
		u.setRol(req.rol());
		u.setTienda(tienda(req));
		u.setActivo(activo);
		if (req.password() != null && !req.password().isBlank()) {
			u.setPasswordHash(encoder.encode(req.password()));
		}
		return aDto(u);
	}

	@Transactional
	public CargoDto crearCargo(CargoRequest req) {
		String nombre = req.nombre().trim();
		if (cargos.existsByNombreIgnoreCase(nombre)) {
			throw duplicadoCargo();
		}
		Cargo c = cargos.save(Cargo.builder().nombre(nombre).salarioBase(req.salarioBase()).descripcion(texto(req.descripcion()))
				.requisitos(texto(req.requisitos())).build());
		return new CargoDto(c.getId(), c.getNombre(), c.getSalarioBase(), c.getDescripcion(), c.getRequisitos());
	}

	@Transactional
	public CargoDto actualizarCargo(Long id, CargoRequest req) {
		Cargo c = cargos.findById(id).orElseThrow(() -> ApiException.noEncontrado("El cargo no existe."));
		String nombre = req.nombre().trim();
		if (cargos.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
			throw duplicadoCargo();
		}
		c.setNombre(nombre);
		c.setSalarioBase(req.salarioBase());
		c.setDescripcion(texto(req.descripcion()));
		c.setRequisitos(texto(req.requisitos()));
		return new CargoDto(c.getId(), c.getNombre(), c.getSalarioBase(), c.getDescripcion(), c.getRequisitos());
	}

	private Tienda tienda(UsuarioRequest req) {
		if (req.rol() != Rol.JEFE_TIENDA) {
			return null;
		}
		if (req.tiendaId() == null) {
			throw ApiException.datosInvalidos("Revisa los campos marcados.").conError("tiendaId", "Elige la tienda del jefe.");
		}
		return tiendas.findById(req.tiendaId())
				.orElseThrow(() -> ApiException.datosInvalidos("Revisa los campos marcados.").conError("tiendaId",
						"La tienda elegida no existe."));
	}

	private static String correo(UsuarioRequest req) {
		return req.correo().trim().toLowerCase();
	}

	private static String texto(String valor) {
		return valor == null || valor.isBlank() ? null : valor.trim();
	}

	private static UsuarioDto aDto(Usuario u) {
		return new UsuarioDto(u.getId(), u.getNombre(), u.getCorreo(), u.getRol(),
				u.getTienda() != null ? u.getTienda().getId() : null,
				u.getTienda() != null ? u.getTienda().getNombre() : null, u.isActivo());
	}

	private static ApiException duplicadoUsuario() {
		return new ApiException(HttpStatus.CONFLICT, "USUARIO_DUPLICADO", "Ya existe un usuario con ese correo.")
				.conError("correo", "Ya existe un usuario con ese correo.");
	}

	private static ApiException duplicadoCargo() {
		return new ApiException(HttpStatus.CONFLICT, "CARGO_DUPLICADO", "Ya existe un cargo con ese nombre.")
				.conError("nombre", "Ya existe un cargo con ese nombre.");
	}
}
