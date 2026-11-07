package pe.quova.ats.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.TiendaDto;
import pe.quova.ats.dto.Dtos.TiendaRequest;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Tienda;
import pe.quova.ats.model.Usuario;
import pe.quova.ats.repo.TiendaRepository;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.repo.VacanteRepository;

@Service
@RequiredArgsConstructor
public class TiendaService {

	private final TiendaRepository tiendas;
	private final VacanteRepository vacantes;
	private final UsuarioRepository usuarios;

	@Transactional(readOnly = true)
	public List<TiendaDto> listar() {
		Map<Long, String> jefes = usuarios.findByRolAndActivoTrue(Rol.JEFE_TIENDA).stream()
				.filter(u -> u.getTienda() != null)
				.collect(Collectors.toMap(u -> u.getTienda().getId(), Usuario::getNombre, (a, b) -> a));
		Map<Long, Long> abiertas = vacantes.findAll().stream()
				.filter(v -> v.getEstado() == EstadoVacante.ABIERTA && v.getTienda() != null)
				.collect(Collectors.groupingBy(v -> v.getTienda().getId(), Collectors.counting()));
		return tiendas.findAllByOrderByNombreAsc().stream().map(t -> aDto(t, jefes, abiertas)).toList();
	}

	@Transactional
	public TiendaDto crear(TiendaRequest req) {
		String nombre = req.nombre().trim();
		if (tiendas.existsByNombreIgnoreCase(nombre)) {
			throw duplicada();
		}
		Tienda t = tiendas.save(Tienda.builder().nombre(nombre).direccion(direccion(req)).distrito(nombre).activa(true)
				.build());
		return aDto(t, Map.of(), Map.of());
	}

	@Transactional
	public TiendaDto actualizar(Long id, TiendaRequest req) {
		Tienda t = buscar(id);
		String nombre = req.nombre().trim();
		if (tiendas.existsByNombreIgnoreCaseAndIdNot(nombre, id)) {
			throw duplicada();
		}
		t.setNombre(nombre);
		t.setDireccion(direccion(req));
		t.setDistrito(nombre);
		return aDto(t);
	}

	@Transactional
	public TiendaDto cambiarActiva(Long id, boolean activa) {
		Tienda t = buscar(id);
		if (!activa && t.isActiva() && vacantesAbiertas(id) > 0) {
			throw new ApiException(HttpStatus.CONFLICT, "TIENDA_CON_VACANTES",
					"No se puede desactivar: la tienda tiene vacantes abiertas.");
		}
		t.setActiva(activa);
		return aDto(t);
	}

	private Tienda buscar(Long id) {
		return tiendas.findById(id).orElseThrow(() -> ApiException.noEncontrado("La tienda no existe."));
	}

	private TiendaDto aDto(Tienda t) {
		Map<Long, String> jefes = usuarios.findByRolAndActivoTrue(Rol.JEFE_TIENDA).stream()
				.filter(u -> u.getTienda() != null)
				.collect(Collectors.toMap(u -> u.getTienda().getId(), Usuario::getNombre, (a, b) -> a));
		return aDto(t, jefes, Map.of(t.getId(), vacantesAbiertas(t.getId())));
	}

	private TiendaDto aDto(Tienda t, Map<Long, String> jefes, Map<Long, Long> abiertas) {
		return new TiendaDto(t.getId(), t.getNombre(), t.getDireccion(), t.getDistrito(), t.isActiva(),
				jefes.get(t.getId()), abiertas.getOrDefault(t.getId(), 0L));
	}

	private long vacantesAbiertas(Long tiendaId) {
		return vacantes.findAll().stream()
				.filter(v -> v.getEstado() == EstadoVacante.ABIERTA && v.getTienda() != null
						&& tiendaId.equals(v.getTienda().getId()))
				.count();
	}

	private static String direccion(TiendaRequest req) {
		return req.direccion() == null ? null : req.direccion().trim();
	}

	private static ApiException duplicada() {
		return new ApiException(HttpStatus.CONFLICT, "TIENDA_DUPLICADA", "Ya existe una tienda con ese nombre.")
				.conError("nombre", "Ya existe una tienda con ese nombre.");
	}
}
