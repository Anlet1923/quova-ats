package pe.quova.ats.web;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.AvisoDto;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.AvisoService;

@RestController
@RequestMapping("/api/avisos")
@RequiredArgsConstructor
@Tag(name = "Avisos")
public class AvisoController {

	private final AvisoService avisos;

	@GetMapping
	public List<AvisoDto> listar(@AuthenticationPrincipal UsuarioActual u) {
		return avisos.listar(u);
	}
}
