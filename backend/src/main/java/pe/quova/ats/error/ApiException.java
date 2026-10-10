package pe.quova.ats.error;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;

import lombok.Getter;

/** Error de negocio con código HTTP, código legible por el frontend y mensaje en español. */
@Getter
public class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final String codigo;
	private final Map<String, String> errores = new LinkedHashMap<>();
	private final Map<String, Object> extra = new LinkedHashMap<>();

	public ApiException(HttpStatus status, String codigo, String mensaje) {
		super(mensaje);
		this.status = status;
		this.codigo = codigo;
	}

	public ApiException conError(String campo, String mensaje) {
		errores.put(campo, mensaje);
		return this;
	}

	public ApiException conDato(String clave, Object valor) {
		extra.put(clave, valor);
		return this;
	}

	public static ApiException noEncontrado(String mensaje) {
		return new ApiException(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", mensaje);
	}

	public static ApiException datosInvalidos(String mensaje) {
		return new ApiException(HttpStatus.BAD_REQUEST, "DATOS_INVALIDOS", mensaje);
	}

	public static ApiException sinPermiso(String mensaje) {
		return new ApiException(HttpStatus.FORBIDDEN, "SIN_PERMISO", mensaje);
	}
}
