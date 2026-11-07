package pe.quova.ats.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.EntrevistaDto;
import pe.quova.ats.dto.Dtos.EntrevistaRequest;
import pe.quova.ats.dto.Dtos.EvaluacionRequest;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.EntrevistaService;

@RestController
@RequestMapping("/api/entrevistas")
@RequiredArgsConstructor
@Tag(name = "Entrevistas")
public class EntrevistaController {

	private final EntrevistaService entrevistas;

	@GetMapping
	public List<EntrevistaDto> listar(@AuthenticationPrincipal UsuarioActual u) {
		return entrevistas.listar(u);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('RECLUTADOR')")
	public EntrevistaDto crear(@Valid @RequestBody EntrevistaRequest req) {
		return entrevistas.crear(req);
	}

	@PostMapping("/{id}/evaluar")
	@PreAuthorize("hasRole('JEFE_TIENDA')")
	public EntrevistaDto evaluar(@PathVariable Long id, @Valid @RequestBody EvaluacionRequest req,
			@AuthenticationPrincipal UsuarioActual u) {
		return entrevistas.evaluar(id, req, u);
	}
}
