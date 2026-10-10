package pe.quova.ats.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import pe.quova.ats.model.Usuario;

@Service
public class JwtService {

	private final SecretKey clave;
	private final long minutos;

	public JwtService(@Value("${quova.jwt.secret}") String secreto,
			@Value("${quova.jwt.expiracion-minutos}") long minutos) {
		this.clave = Keys.hmacShaKeyFor(secreto.getBytes(StandardCharsets.UTF_8));
		this.minutos = minutos;
	}

	public String generar(Usuario usuario) {
		Date ahora = new Date();
		return Jwts.builder()
				.subject(String.valueOf(usuario.getId()))
				.claim("rol", usuario.getRol().name())
				.issuedAt(ahora)
				.expiration(new Date(ahora.getTime() + minutos * 60_000))
				.signWith(clave)
				.compact();
	}

	/** Devuelve el id del usuario o nulo si el token no es válido o ya expiró. */
	public Long leerUsuarioId(String token) {
		try {
			return Long.valueOf(Jwts.parser().verifyWith(clave).build().parseSignedClaims(token).getPayload()
					.getSubject());
		} catch (JwtException | IllegalArgumentException e) {
			return null;
		}
	}
}
