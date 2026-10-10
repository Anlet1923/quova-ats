package pe.quova.ats.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.DniDisponibleDto;
import pe.quova.ats.dto.Dtos.PostulacionCreadaDto;
import pe.quova.ats.dto.Dtos.PostulacionRequest;
import pe.quova.ats.dto.Dtos.VacantePublicaDto;
import pe.quova.ats.service.PostulacionService;

/** Endpoints públicos del portal de postulación (sin cuenta ni token de sesión). */
@RestController
@RequestMapping("/api/public/vacantes")
@RequiredArgsConstructor
@SecurityRequirements
@Tag(name = "B. Portal de postulación")
public class PortalController {

	private final PostulacionService postulaciones;

	@GetMapping
	@Operation(summary = "Vacantes abiertas (para «Ver otras vacantes»)")
	public List<VacantePublicaDto> abiertas() {
		return postulaciones.abiertas();
	}

	@GetMapping("/{token}")
	@Operation(summary = "Datos de la vacante del link; 410 si está cerrada")
	public VacantePublicaDto vacante(@PathVariable String token) {
		return postulaciones.vacante(token);
	}

	@GetMapping("/{token}/verificar-dni")
	@Operation(summary = "Verifica el DNI al terminar el paso 1; 409 si ya postuló a esta vacante")
	public DniDisponibleDto verificarDni(@PathVariable String token, @RequestParam String dni) {
		postulaciones.verificarDni(token, dni);
		return new DniDisponibleDto(true);
	}

	@PostMapping(path = "/{token}/postulaciones", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Registra la postulación; 400 datos inválidos, 409 duplicada, 410 vacante cerrada")
	public PostulacionCreadaDto postular(@PathVariable String token,
			@Valid @RequestPart("datos") PostulacionRequest datos,
			@RequestPart(name = "cv", required = false) MultipartFile cv,
			@RequestParam(required = false) String fuente) {
		return postulaciones.postular(token, datos, cv, fuente);
	}
}
