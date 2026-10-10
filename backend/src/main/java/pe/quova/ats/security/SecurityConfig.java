package pe.quova.ats.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import pe.quova.ats.error.ManejadorErrores;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private static final String[] RUTAS_PUBLICAS = { "/api/auth/login", "/api/public/", "/swagger-ui", "/v3/api-docs",
			"/h2-console", "/error" };

	@Bean
	SecurityFilterChain filtros(HttpSecurity http, JwtFiltro jwtFiltro, ObjectMapper json) throws Exception {
		// Matchers por URI: la consola H2 registra un segundo servlet y los patrones de texto serían ambiguos.
		RequestMatcher publicas = request -> empiezaCon(request, RUTAS_PUBLICAS);
		RequestMatcher api = request -> empiezaCon(request, "/api/");

		http.csrf(csrf -> csrf.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.headers(h -> h.frameOptions(f -> f.sameOrigin()))
				.authorizeHttpRequests(a -> a
						.requestMatchers(publicas).permitAll()
						.requestMatchers(api).authenticated()
						.anyRequest().permitAll())
				.exceptionHandling(e -> e
						.authenticationEntryPoint((req, res, ex) -> escribir(json, res, HttpStatus.UNAUTHORIZED,
								"NO_AUTENTICADO", "Tu sesión expiró o no has iniciado sesión."))
						.accessDeniedHandler((req, res, ex) -> escribir(json, res, HttpStatus.FORBIDDEN,
								"SIN_PERMISO", "Tu rol no permite realizar esta acción.")))
				.addFilterBefore(jwtFiltro, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	private static boolean empiezaCon(HttpServletRequest request, String... prefijos) {
		String ruta = request.getRequestURI().substring(request.getContextPath().length());
		for (String prefijo : prefijos) {
			if (ruta.startsWith(prefijo)) {
				return true;
			}
		}
		return false;
	}

	private static void escribir(ObjectMapper json, HttpServletResponse res, HttpStatus status, String codigo,
			String mensaje) throws IOException {
		res.setStatus(status.value());
		res.setContentType(MediaType.APPLICATION_JSON_VALUE);
		res.setCharacterEncoding(StandardCharsets.UTF_8.name());
		json.writeValue(res.getWriter(), ManejadorErrores.cuerpo(status, codigo, mensaje));
	}
}
