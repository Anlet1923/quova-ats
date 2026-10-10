package pe.quova.ats.service;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.CargoDto;
import pe.quova.ats.dto.Dtos.TiendaDto;
import pe.quova.ats.dto.Dtos.VacanteDto;
import pe.quova.ats.dto.Dtos.VacanteRequest;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Cargo;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Tienda;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.CargoRepository;
import pe.quova.ats.repo.TiendaRepository;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.repo.VacanteRepository;
import pe.quova.ats.security.UsuarioActual;

@Service
@RequiredArgsConstructor
public class VacanteService {

	private static final SecureRandom AZAR = new SecureRandom();
	private static final String ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

	private final VacanteRepository vacantes;
	private final CargoRepository cargos;
	private final TiendaRepository tiendas;
	private final CandidatoRepository candidatos;
	private final UsuarioRepository usuarios;

	@Transactional(readOnly = true)
	public List<TiendaDto> tiendas() {
		return tiendas.findAllByOrderByNombreAsc().stream()
				.map(t -> new TiendaDto(t.getId(), t.getNombre(), t.getDireccion(), t.getDistrito(), t.isActiva()))
				.toList();
	}

	@Transactional(readOnly = true)
	public List<CargoDto> cargos() {
		return cargos.findAllByOrderByIdAsc().stream().map(c -> new CargoDto(c.getId(), c.getNombre(),
				c.getSalarioBase(), c.getDescripcion(), c.getRequisitos())).toList();
	}

	@Transactional(readOnly = true)
	public List<VacanteDto> listar(String q, Long tiendaId, Long cargoId, EstadoVacante estado, UsuarioActual u) {
		Map<Long, Long> conteo = conteoCandidatos();
		Long restringida = u.tiendaRestringida();
		// Cada palabra de la búsqueda debe aparecer en el título ("cajero surco" encuentra "Cajero/a · Surco")
		List<String> palabras = Arrays.stream(normalizar(q).split("\\s+")).filter(p -> !p.isEmpty()).toList();
		return vacantes.buscarTodasConDetalle().stream()
				.filter(v -> restringida == null || esDeTienda(v, restringida))
				.filter(v -> tiendaId == null || esDeTienda(v, tiendaId))
				.filter(v -> cargoId == null || cargoId.equals(v.getCargo().getId()))
				.filter(v -> estado == null || v.getEstado() == estado)
				.filter(v -> palabras.stream().allMatch(normalizar(v.getTitulo())::contains))
				.map(v -> aDto(v, conteo.getOrDefault(v.getId(), 0L)))
				.toList();
	}

	@Transactional(readOnly = true)
	public VacanteDto obtener(Long id, UsuarioActual u) {
		Vacante v = buscar(id);
		Long restringida = u.tiendaRestringida();
		if (restringida != null && !esDeTienda(v, restringida)) {
			throw ApiException.sinPermiso("Solo puedes consultar las vacantes de tu tienda.");
		}
		return aDto(v, conteoCandidatos().getOrDefault(v.getId(), 0L));
	}

	@Transactional
	public VacanteDto crear(VacanteRequest req, UsuarioActual u) {
		Cargo cargo = cargos.findById(req.cargoId()).orElseThrow(() -> ApiException
				.datosInvalidos("Revisa los campos marcados.").conError("cargoId", "El cargo elegido no existe."));
		Tienda tienda = null;
		if (req.tiendaId() != null) {
			tienda = tiendas.findById(req.tiendaId()).orElseThrow(() -> ApiException
					.datosInvalidos("Revisa los campos marcados.").conError("tiendaId", "La tienda elegida no existe."));
			if (!tienda.isActiva()) {
				throw ApiException.datosInvalidos("Revisa los campos marcados.").conError("tiendaId",
						"La tienda está inactiva. Elige una tienda activa.");
			}
		}
		Vacante v = Vacante.builder()
				.cargo(cargo)
				.tienda(tienda)
				.turno(req.turno())
				.puestos(req.puestos())
				.salario(req.salario() != null ? req.salario() : cargo.getSalarioBase())
				.fechaCierre(req.fechaCierre())
				.descripcion(tieneTexto(req.descripcion()) ? req.descripcion().trim() : cargo.getDescripcion())
				.requisitos(tieneTexto(req.requisitos()) ? req.requisitos().trim() : cargo.getRequisitos())
				.urgente(req.urgente())
				.estado(EstadoVacante.BORRADOR)
				.creadaEn(LocalDateTime.now())
				.creadaPor(usuarios.getReferenceById(u.id()))
				.build();
		if (req.publicar()) {
			abrir(v, req.crearIgualmente());
		}
		return aDto(vacantes.save(v), 0);
	}

	@Transactional
	public VacanteDto publicar(Long id, boolean crearIgualmente) {
		Vacante v = buscar(id);
		if (v.getEstado() != EstadoVacante.BORRADOR) {
			throw new ApiException(HttpStatus.CONFLICT, "ESTADO_INVALIDO", "Solo se pueden publicar los borradores.");
		}
		abrir(v, crearIgualmente);
		return aDto(v, conteoCandidatos().getOrDefault(v.getId(), 0L));
	}

	@Transactional
	public VacanteDto cerrar(Long id) {
		Vacante v = buscar(id);
		if (v.getEstado() != EstadoVacante.ABIERTA) {
			throw new ApiException(HttpStatus.CONFLICT, "ESTADO_INVALIDO", "Solo se pueden cerrar las vacantes abiertas.");
		}
		v.setEstado(EstadoVacante.CERRADA);
		v.setCerradaEn(LocalDateTime.now());
		return aDto(v, conteoCandidatos().getOrDefault(v.getId(), 0L));
	}

	/** Pasa la vacante a ABIERTA: exige los datos completos, avisa si hay una igual y genera el link único. */
	private void abrir(Vacante v, boolean crearIgualmente) {
		ApiException invalida = ApiException.datosInvalidos("Completa los datos obligatorios para publicar la vacante.");
		if (v.getTienda() == null) {
			invalida.conError("tiendaId", "Elige la tienda de la vacante.");
		}
		if (v.getTurno() == null) {
			invalida.conError("turno", "Elige el turno.");
		}
		if (v.getPuestos() == null || v.getPuestos() < 1) {
			invalida.conError("puestos", "Indica al menos 1 puesto.");
		}
		if (v.getSalario() == null || v.getSalario().signum() <= 0) {
			invalida.conError("salario", "El salario debe ser mayor a cero.");
		}
		if (v.getFechaCierre() == null || !v.getFechaCierre().isAfter(LocalDate.now())) {
			invalida.conError("fechaCierre", "La fecha de cierre debe ser posterior a hoy.");
		}
		if (!invalida.getErrores().isEmpty()) {
			throw invalida;
		}
		if (!crearIgualmente) {
			vacantes.findByTiendaIdAndCargoIdAndTurnoAndEstado(v.getTienda().getId(), v.getCargo().getId(),
					v.getTurno(), EstadoVacante.ABIERTA).stream()
					.filter(otra -> !otra.getId().equals(v.getId()))
					.findFirst()
					.ifPresent(otra -> {
						throw new ApiException(HttpStatus.CONFLICT, "VACANTE_DUPLICADA",
								"Ya existe una vacante abierta para el mismo cargo, tienda y turno.")
								.conDato("existenteId", otra.getId()).conDato("existenteTitulo", v.getTitulo());
					});
		}
		v.setEstado(EstadoVacante.ABIERTA);
		v.setPublicadaEn(LocalDateTime.now());
		if (v.getToken() == null) {
			v.setToken(nuevoToken());
		}
	}

	private String nuevoToken() {
		String token;
		do {
			StringBuilder sb = new StringBuilder(10);
			for (int i = 0; i < 10; i++) {
				sb.append(ALFABETO.charAt(AZAR.nextInt(ALFABETO.length())));
			}
			token = sb.toString();
		} while (vacantes.existsByToken(token));
		return token;
	}

	private Vacante buscar(Long id) {
		return vacantes.buscarConDetalle(id).orElseThrow(() -> ApiException.noEncontrado("La vacante no existe."));
	}

	private Map<Long, Long> conteoCandidatos() {
		Map<Long, Long> conteo = new HashMap<>();
		candidatos.contarPorVacante().forEach(fila -> conteo.put((Long) fila[0], (Long) fila[1]));
		return conteo;
	}

	private static boolean esDeTienda(Vacante v, Long tiendaId) {
		return v.getTienda() != null && tiendaId.equals(v.getTienda().getId());
	}

	private static boolean tieneTexto(String s) {
		return s != null && !s.isBlank();
	}

	static String normalizar(String s) {
		if (s == null) {
			return "";
		}
		return Normalizer.normalize(s.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
	}

	static VacanteDto aDto(Vacante v, long candidatos) {
		Tienda t = v.getTienda();
		return new VacanteDto(v.getId(), v.getTitulo(), v.getCargo().getId(), v.getCargo().getNombre(),
				t != null ? t.getId() : null, t != null ? t.getNombre() : null, v.getTurno(), v.getPuestos(),
				v.getSalario(), v.getFechaCierre(), v.getDescripcion(), v.getRequisitos(), v.isUrgente(),
				v.getEstado(), v.getToken(), v.getCreadaEn(), candidatos);
	}
}
