package pe.quova.ats.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
import pe.quova.ats.dto.Dtos.TiendaDto;
import pe.quova.ats.dto.Dtos.TiendaRequest;
import pe.quova.ats.service.TiendaService;

@RestController
@RequestMapping("/api/tiendas")
@RequiredArgsConstructor
@Tag(name = "Tiendas")
public class TiendaController {

	private static final String ADMIN = "hasRole('ADMIN')";

	private final TiendaService tiendas;

	@GetMapping
	public List<TiendaDto> listar() {
		return tiendas.listar();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize(ADMIN)
	public TiendaDto crear(@Valid @RequestBody TiendaRequest req) {
		return tiendas.crear(req);
	}

	@PostMapping("/{id}")
	@PreAuthorize(ADMIN)
	public TiendaDto actualizar(@PathVariable Long id, @Valid @RequestBody TiendaRequest req) {
		return tiendas.actualizar(id, req);
	}

	@PostMapping("/{id}/activar")
	@PreAuthorize(ADMIN)
	public TiendaDto activar(@PathVariable Long id) {
		return tiendas.cambiarActiva(id, true);
	}

	@PostMapping("/{id}/desactivar")
	@PreAuthorize(ADMIN)
	public TiendaDto desactivar(@PathVariable Long id) {
		return tiendas.cambiarActiva(id, false);
	}
}
