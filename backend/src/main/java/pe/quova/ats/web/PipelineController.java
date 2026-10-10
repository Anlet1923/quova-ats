package pe.quova.ats.web;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.CandidatoDto;
import pe.quova.ats.dto.Dtos.DashboardDto;
import pe.quova.ats.dto.Dtos.DescartarRequest;
import pe.quova.ats.dto.Dtos.HistorialDto;
import pe.quova.ats.dto.Dtos.MoverRequest;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.DashboardService;
import pe.quova.ats.service.PipelineService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "D-E. Pipeline y dashboard")
public class PipelineController {

	/** Según la tabla de permisos del informe, solo el reclutador mueve candidatos; el resto consulta. */
	private static final String PUEDE_MOVER = "hasRole('RECLUTADOR')";

	private final PipelineService pipeline;
	private final DashboardService dashboard;

	@GetMapping("/candidatos")
	@Operation(summary = "Candidatos del pipeline, con filtros por vacante y tienda")
	public List<CandidatoDto> listar(@RequestParam(required = false) Long vacanteId,
			@RequestParam(required = false) Long tiendaId, @AuthenticationPrincipal UsuarioActual u) {
		return pipeline.listar(vacanteId, tiendaId, u);
	}

	@PostMapping("/candidatos/{id}/mover")
	@PreAuthorize(PUEDE_MOVER)
	@Operation(summary = "Avanza al candidato; 409 MOVIMIENTO_NO_PERMITIDO si se intenta retroceder")
	public CandidatoDto mover(@PathVariable Long id, @Valid @RequestBody MoverRequest req,
			@AuthenticationPrincipal UsuarioActual u) {
		return pipeline.mover(id, req.etapaDestino(), u);
	}

	@PostMapping("/candidatos/{id}/descartar")
	@PreAuthorize(PUEDE_MOVER)
	@Operation(summary = "Descarta con motivo obligatorio; opcionalmente guarda en el banco de talento")
	public CandidatoDto descartar(@PathVariable Long id, @Valid @RequestBody DescartarRequest req,
			@AuthenticationPrincipal UsuarioActual u) {
		return pipeline.descartar(id, req, u);
	}

	@GetMapping("/candidatos/{id}/historial")
	@Operation(summary = "Historial de cambios de etapa del candidato")
	public List<HistorialDto> historial(@PathVariable Long id) {
		return pipeline.historial(id);
	}

	@GetMapping("/dashboard")
	@Operation(summary = "Indicadores y gráficos calculados con los datos reales")
	public DashboardDto dashboard(@AuthenticationPrincipal UsuarioActual u) {
		return dashboard.resumen(u);
	}
}
