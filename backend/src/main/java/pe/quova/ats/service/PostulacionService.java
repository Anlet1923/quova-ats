package pe.quova.ats.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import pe.quova.ats.dto.Dtos.PostulacionCreadaDto;
import pe.quova.ats.dto.Dtos.PostulacionRequest;
import pe.quova.ats.dto.Dtos.VacantePublicaDto;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Candidato;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Fuente;
import pe.quova.ats.model.Etapa;
import pe.quova.ats.model.HistorialEtapa;
import pe.quova.ats.model.Vacante;
import pe.quova.ats.repo.CandidatoRepository;
import pe.quova.ats.repo.HistorialEtapaRepository;
import pe.quova.ats.repo.VacanteRepository;

/** Portal público: el candidato postula sin cuenta, a través del link único de la vacante. */
@Service
public class PostulacionService {

	public static final long MAX_CV_BYTES = 10L * 1024 * 1024;
	private static final String MENSAJE_CV = "Solo se aceptan PDF o Word de hasta 10 MB. Puedes enviar sin CV.";

	private final VacanteRepository vacantes;
	private final CandidatoRepository candidatos;
	private final HistorialEtapaRepository historial;
	private final Path directorioCv;

	public PostulacionService(VacanteRepository vacantes, CandidatoRepository candidatos,
			HistorialEtapaRepository historial, @Value("${quova.cv.directorio}") String directorioCv) {
		this.vacantes = vacantes;
		this.candidatos = candidatos;
		this.historial = historial;
		this.directorioCv = Path.of(directorioCv);
	}

	@Transactional(readOnly = true)
	public VacantePublicaDto vacante(String token) {
		return aDto(vacanteAbierta(token));
	}

	@Transactional(readOnly = true)
	public List<VacantePublicaDto> abiertas() {
		return vacantes.buscarTodasConDetalle().stream().filter(Vacante::aceptaPostulaciones)
				.map(PostulacionService::aDto).toList();
	}

	@Transactional(readOnly = true)
	public void verificarDni(String token, String dni) {
		if (dni == null || !dni.matches("\\d{8}")) {
			throw ApiException.datosInvalidos("Revisa los campos marcados.").conError("dni",
					"El DNI debe tener 8 dígitos numéricos.");
		}
		Vacante v = vacanteAbierta(token);
		if (candidatos.existsByVacanteIdAndDni(v.getId(), dni)) {
			throw duplicada();
		}
	}

	@Transactional
	public PostulacionCreadaDto postular(String token, PostulacionRequest req, MultipartFile cv, String fuente) {
		// Regla 3: si la vacante se cerró mientras el candidato llenaba el formulario, se avisa aquí (410).
		Vacante v = vacanteAbierta(token);
		if (candidatos.existsByVacanteIdAndDni(v.getId(), req.dni())) {
			throw duplicada();
		}
		boolean conExperiencia = Boolean.TRUE.equals(req.experienciaRetail());
		if (conExperiencia && (req.tiempoExperiencia() == null || req.tiempoExperiencia().isBlank())) {
			throw ApiException.datosInvalidos("Revisa los campos marcados.").conError("tiempoExperiencia",
					"Cuéntanos cuánto tiempo de experiencia tienes.");
		}

		LocalDateTime ahora = LocalDateTime.now();
		Candidato c = Candidato.builder()
				.vacante(v)
				.nombre(req.nombre().trim().replaceAll("\\s+", " "))
				.dni(req.dni())
				.celular(req.celular())
				.correo(req.correo() == null || req.correo().isBlank() ? null : req.correo().trim().toLowerCase())
				.distrito(req.distrito().trim())
				.inicio(req.inicio())
				.turnos(new HashSet<>(req.turnos()))
				.experienciaRetail(conExperiencia)
				.tiempoExperiencia(conExperiencia ? req.tiempoExperiencia().trim() : null)
				.motivacion(req.motivacion().trim())
				.atencionAfluencia(req.atencionAfluencia().trim())
				.otrosLocales(Boolean.TRUE.equals(req.otrosLocales()))
				.consentimiento(true)
				.fuente(Fuente.desde(fuente))
				.etapa(Etapa.NUEVO)
				.etapaDesde(ahora)
				.creadoEn(ahora)
				.build();
		if (cv != null && !cv.isEmpty()) {
			String extension = extensionPermitida(cv);
			c.setCvNombre(cv.getOriginalFilename());
			c.setCvRuta(guardarCv(cv, extension));
		}
		candidatos.save(c);
		historial.save(HistorialEtapa.builder().candidato(c).etapaDestino(Etapa.NUEVO).fecha(ahora)
				.comentario("Postulación recibida por el portal").build());
		return new PostulacionCreadaDto(c.getId(), c.getNombre(), v.getCargo().getNombre(),
				v.getTienda().getNombre(), ahora);
	}

	private Vacante vacanteAbierta(String token) {
		Vacante v = vacantes.buscarPorToken(token).filter(x -> x.getEstado() != EstadoVacante.BORRADOR)
				.orElseThrow(() -> ApiException.noEncontrado("El link de postulación no es válido."));
		if (!v.aceptaPostulaciones()) {
			throw new ApiException(HttpStatus.GONE, "VACANTE_CERRADA", "Esta vacante ya no recibe postulaciones.")
					.conDato("vacante", v.getCargo().getNombre()).conDato("tienda", v.getTienda().getNombre());
		}
		return v;
	}

	private static ApiException duplicada() {
		return new ApiException(HttpStatus.CONFLICT, "POSTULACION_DUPLICADA",
				"Ya registramos una postulación con este DNI para esta vacante.");
	}

	private static String extensionPermitida(MultipartFile cv) {
		String nombre = cv.getOriginalFilename() == null ? "" : cv.getOriginalFilename().toLowerCase(Locale.ROOT);
		String extension = nombre.contains(".") ? nombre.substring(nombre.lastIndexOf('.') + 1) : "";
		if (cv.getSize() > MAX_CV_BYTES || !List.of("pdf", "doc", "docx").contains(extension)) {
			throw ApiException.datosInvalidos(MENSAJE_CV).conError("cv", MENSAJE_CV);
		}
		return extension;
	}

	private String guardarCv(MultipartFile cv, String extension) {
		try {
			Files.createDirectories(directorioCv);
			Path destino = directorioCv.resolve(UUID.randomUUID() + "." + extension);
			cv.transferTo(destino.toAbsolutePath());
			return destino.toString();
		} catch (IOException e) {
			throw new UncheckedIOException("No se pudo guardar el CV", e);
		}
	}

	private static VacantePublicaDto aDto(Vacante v) {
		return new VacantePublicaDto(v.getToken(), v.getTitulo(), v.getCargo().getNombre(), v.getTienda().getNombre(),
				v.getTienda().getDistrito(), v.getTienda().getDireccion(), v.getTurno(), v.getSalario(),
				v.getDescripcion(), v.getRequisitos(), v.getFechaCierre());
	}
}
