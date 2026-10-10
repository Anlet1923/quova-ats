package pe.quova.ats.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.dto.Dtos.LoginRequest;
import pe.quova.ats.dto.Dtos.LoginResponse;
import pe.quova.ats.dto.Dtos.UsuarioDto;
import pe.quova.ats.security.UsuarioActual;
import pe.quova.ats.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "A. Autenticación")
public class AuthController {

	private final AuthService auth;

	@PostMapping("/login")
	@Operation(summary = "Inicia sesión con correo @quova.pe; 401 con intentos restantes, 423 si la cuenta está bloqueada")
	public LoginResponse login(@Valid @RequestBody LoginRequest req) {
		return auth.login(req);
	}

	@GetMapping("/me")
	@Operation(summary = "Datos del usuario autenticado")
	public UsuarioDto yo(@AuthenticationPrincipal UsuarioActual u) {
		return auth.perfil(u.id());
	}
}
