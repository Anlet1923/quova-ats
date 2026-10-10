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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.CargoDto;
import pe.quova.ats.dto.Dtos.TiendaDto;
import pe.quova.ats.dto.Dtos.VacanteDto;
import pe.quova.ats.dto.Dtos.VacanteRequest;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.VacanteService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "C. Vacantes")
public class VacanteController {

	private static final String PUEDE_GESTIONAR = "hasAnyRole('RECLUTADOR','ADMIN')";

	private final VacanteService vacantes;

	@GetMapping("/tiendas")
	@Operation(summary = "Catálogo de tiendas (activas e inactivas)")
	public List<TiendaDto> tiendas() {
		return vacantes.tiendas();
	}

	@GetMapping("/cargos")
	@Operation(summary = "Cargos con salario base y plantilla")
	public List<CargoDto> cargos() {
		return vacantes.cargos();
	}

	@GetMapping("/vacantes")
	@Operation(summary = "Listado con búsqueda y filtros por tienda, cargo y estado")
	public List<VacanteDto> listar(@RequestParam(required = false) String q,
			@RequestParam(required = false) Long tiendaId, @RequestParam(required = false) Long cargoId,
			@RequestParam(required = false) EstadoVacante estado, @AuthenticationPrincipal UsuarioActual u) {
		return vacantes.listar(q, tiendaId, cargoId, estado, u);
	}

	@GetMapping("/vacantes/{id}")
	public VacanteDto obtener(@PathVariable Long id, @AuthenticationPrincipal UsuarioActual u) {
		return vacantes.obtener(id, u);
	}

	@PostMapping("/vacantes")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize(PUEDE_GESTIONAR)
	@Operation(summary = "Crea una vacante como borrador o publicada; 409 VACANTE_DUPLICADA si ya hay una igual abierta")
	public VacanteDto crear(@Valid @RequestBody VacanteRequest req, @AuthenticationPrincipal UsuarioActual u) {
		return vacantes.crear(req, u);
	}

	@PostMapping("/vacantes/{id}/publicar")
	@PreAuthorize(PUEDE_GESTIONAR)
	@Operation(summary = "Publica un borrador y genera el link único")
	public VacanteDto publicar(@PathVariable Long id, @RequestParam(defaultValue = "false") boolean crearIgualmente) {
		return vacantes.publicar(id, crearIgualmente);
	}

	@PostMapping("/vacantes/{id}/cerrar")
	@PreAuthorize(PUEDE_GESTIONAR)
	@Operation(summary = "Cierra la vacante: el link deja de aceptar postulaciones y los candidatos se conservan")
	public VacanteDto cerrar(@PathVariable Long id) {
		return vacantes.cerrar(id);
	}
}
