package pe.quova.ats.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import pe.quova.ats.model.Usuario;
import pe.quova.ats.repo.UsuarioRepository;

/** Lee el JWT de la cabecera Authorization y carga al usuario (si sigue activo) en el contexto. */
@Component
@RequiredArgsConstructor
public class JwtFiltro extends OncePerRequestFilter {

	private final JwtService jwt;
	private final UsuarioRepository usuarios;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String cabecera = request.getHeader("Authorization");
		if (cabecera != null && cabecera.startsWith("Bearer ")
				&& SecurityContextHolder.getContext().getAuthentication() == null) {
			Long id = jwt.leerUsuarioId(cabecera.substring(7));
			if (id != null) {
				usuarios.findById(id).filter(Usuario::isActivo).ifPresent(u -> {
					UsuarioActual actual = UsuarioActual.de(u);
					var auth = new UsernamePasswordAuthenticationToken(actual, null,
							List.of(new SimpleGrantedAuthority("ROLE_" + u.getRol().name())));
					SecurityContextHolder.getContext().setAuthentication(auth);
				});
			}
		}
		chain.doFilter(request, response);
	}
}
