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
import pe.quova.ats.dto.Dtos.CargoDto;
import pe.quova.ats.dto.Dtos.CargoRequest;
import pe.quova.ats.dto.Dtos.PlantillaDto;
import pe.quova.ats.dto.Dtos.PlantillaRequest;
import pe.quova.ats.dto.Dtos.UsuarioDto;
import pe.quova.ats.dto.Dtos.UsuarioRequest;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.ConfiguracionService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Configuración")
public class ConfiguracionController {

	private static final String ADMIN = "hasRole('ADMIN')";

	private final ConfiguracionService configuracion;

	@GetMapping("/usuarios")
	@PreAuthorize(ADMIN)
	public List<UsuarioDto> usuarios() {
		return configuracion.usuarios();
	}

	@PostMapping("/usuarios")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize(ADMIN)
	public UsuarioDto crearUsuario(@Valid @RequestBody UsuarioRequest req) {
		return configuracion.crearUsuario(req);
	}

	@PostMapping("/usuarios/{id}")
	@PreAuthorize(ADMIN)
	public UsuarioDto actualizarUsuario(@PathVariable Long id, @Valid @RequestBody UsuarioRequest req,
			@AuthenticationPrincipal UsuarioActual actual) {
		return configuracion.actualizarUsuario(id, req, actual);
	}

	@PostMapping("/cargos")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize(ADMIN)
	public CargoDto crearCargo(@Valid @RequestBody CargoRequest req) {
		return configuracion.crearCargo(req);
	}

	@PostMapping("/cargos/{id}")
	@PreAuthorize(ADMIN)
	public CargoDto actualizarCargo(@PathVariable Long id, @Valid @RequestBody CargoRequest req) {
		return configuracion.actualizarCargo(id, req);
	}

	@GetMapping("/plantillas")
	@PreAuthorize(ADMIN)
	public List<PlantillaDto> plantillas() {
		return configuracion.plantillas();
	}

	@PostMapping("/plantillas")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize(ADMIN)
	public PlantillaDto crearPlantilla(@Valid @RequestBody PlantillaRequest req) {
		return configuracion.crearPlantilla(req);
	}

	@PostMapping("/plantillas/{id}")
	@PreAuthorize(ADMIN)
	public PlantillaDto actualizarPlantilla(@PathVariable Long id, @Valid @RequestBody PlantillaRequest req) {
		return configuracion.actualizarPlantilla(id, req);
	}
}
