package pe.quova.ats.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import pe.quova.ats.dto.Dtos.LoginRequest;
import pe.quova.ats.dto.Dtos.LoginResponse;
import pe.quova.ats.dto.Dtos.UsuarioDto;
import pe.quova.ats.error.ApiException;
import pe.quova.ats.model.Usuario;
import pe.quova.ats.repo.UsuarioRepository;
import pe.quova.ats.security.JwtService;

@Service
public class AuthService {

	private static final String MENSAJE_GENERICO = "Correo o contraseña incorrectos.";

	private final UsuarioRepository usuarios;
	private final PasswordEncoder encoder;
	private final JwtService jwt;
	private final int maxIntentos;
	private final int minutosBloqueo;

	/**
	 * Intentos de correos que no existen. Se cuentan igual que los reales para que la respuesta no revele
	 * si un correo está registrado.
	 */
	private final Map<String, Usuario> desconocidos = new ConcurrentHashMap<>();

	public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt,
			@Value("${quova.login.max-intentos}") int maxIntentos,
			@Value("${quova.login.minutos-bloqueo}") int minutosBloqueo) {
		this.usuarios = usuarios;
		this.encoder = encoder;
		this.jwt = jwt;
		this.maxIntentos = maxIntentos;
		this.minutosBloqueo = minutosBloqueo;
	}

	// Sin @Transactional a propósito: el intento fallido debe guardarse aunque luego se lance el error.
	public LoginResponse login(LoginRequest req) {
		String correo = req.correo().trim().toLowerCase();
		LocalDateTime ahora = LocalDateTime.now();
		Usuario real = usuarios.findByCorreoIgnoreCase(correo).orElse(null);
		Usuario u = real != null ? real : desconocidos.computeIfAbsent(correo, c -> new Usuario());

		if (u.getBloqueadoHasta() != null) {
			if (u.getBloqueadoHasta().isAfter(ahora)) {
				throw bloqueada(u.getBloqueadoHasta(), ahora);
			}
			u.setBloqueadoHasta(null);
			u.setIntentosFallidos(0);
		}

		if (real == null || !encoder.matches(req.password(), real.getPasswordHash())) {
			u.setIntentosFallidos(u.getIntentosFallidos() + 1);
			boolean bloquear = u.getIntentosFallidos() >= maxIntentos;
			if (bloquear) {
				u.setIntentosFallidos(0);
				u.setBloqueadoHasta(ahora.plusMinutes(minutosBloqueo));
			}
			int restantes = maxIntentos - u.getIntentosFallidos();
			guardar(real);
			if (bloquear) {
				throw bloqueada(u.getBloqueadoHasta(), ahora);
			}
			throw new ApiException(HttpStatus.UNAUTHORIZED, "CREDENCIALES_INVALIDAS",
					MENSAJE_GENERICO + " Te " + (restantes == 1 ? "queda 1 intento." : "quedan " + restantes
							+ " intentos."))
					.conDato("intentosRestantes", restantes);
		}

		if (!real.isActivo()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "USUARIO_INACTIVO",
					"Tu cuenta está inactiva. Contacta a TI.");
		}

		real.setIntentosFallidos(0);
		real.setBloqueadoHasta(null);
		usuarios.save(real);
		return new LoginResponse(jwt.generar(real), aDto(real));
	}

	public UsuarioDto perfil(Long id) {
		return usuarios.findById(id).map(AuthService::aDto)
				.orElseThrow(() -> ApiException.noEncontrado("El usuario ya no existe."));
	}

	private void guardar(Usuario real) {
		if (real != null) {
			usuarios.save(real);
		}
	}

	private ApiException bloqueada(LocalDateTime hasta, LocalDateTime ahora) {
		long minutos = Math.max(1, (long) Math.ceil(Duration.between(ahora, hasta).toSeconds() / 60.0));
		return new ApiException(HttpStatus.LOCKED, "CUENTA_BLOQUEADA",
				"Por seguridad bloqueamos el acceso tras " + maxIntentos + " intentos fallidos. Vuelve a intentarlo en "
						+ minutos + (minutos == 1 ? " minuto" : " minutos") + " o recupera tu contraseña.")
				.conDato("minutosRestantes", minutos).conDato("bloqueadoHasta", hasta.toString());
	}

	private static UsuarioDto aDto(Usuario u) {
		return new UsuarioDto(u.getId(), u.getNombre(), u.getCorreo(), u.getRol(),
				u.getTienda() != null ? u.getTienda().getId() : null,
				u.getTienda() != null ? u.getTienda().getNombre() : null);
	}
}
