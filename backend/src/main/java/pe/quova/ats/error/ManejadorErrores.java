package pe.quova.ats.error;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Convierte cualquier error en una respuesta JSON uniforme: {codigo, mensaje, errores, ...}. */
@RestControllerAdvice
public class ManejadorErrores {

	private static final Logger log = LoggerFactory.getLogger(ManejadorErrores.class);

	public static Map<String, Object> cuerpo(HttpStatus status, String codigo, String mensaje) {
		Map<String, Object> cuerpo = new LinkedHashMap<>();
		cuerpo.put("estado", status.value());
		cuerpo.put("codigo", codigo);
		cuerpo.put("mensaje", mensaje);
		cuerpo.put("fecha", LocalDateTime.now().toString());
		return cuerpo;
	}

	private static ResponseEntity<Map<String, Object>> respuesta(HttpStatus status, String codigo, String mensaje) {
		return ResponseEntity.status(status).body(cuerpo(status, codigo, mensaje));
	}

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<Map<String, Object>> negocio(ApiException e) {
		Map<String, Object> cuerpo = cuerpo(e.getStatus(), e.getCodigo(), e.getMessage());
		if (!e.getErrores().isEmpty()) {
			cuerpo.put("errores", e.getErrores());
		}
		cuerpo.putAll(e.getExtra());
		return ResponseEntity.status(e.getStatus()).body(cuerpo);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> validacion(MethodArgumentNotValidException e) {
		Map<String, String> errores = new LinkedHashMap<>();
		e.getBindingResult().getFieldErrors()
				.forEach(f -> errores.putIfAbsent(f.getField(), f.getDefaultMessage()));
		Map<String, Object> cuerpo = cuerpo(HttpStatus.BAD_REQUEST, "DATOS_INVALIDOS",
				"Revisa los campos marcados y vuelve a intentarlo.");
		cuerpo.put("errores", errores);
		return ResponseEntity.badRequest().body(cuerpo);
	}

	@ExceptionHandler({ HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
			MissingServletRequestParameterException.class, MissingServletRequestPartException.class,
			HttpMediaTypeNotSupportedException.class })
	public ResponseEntity<Map<String, Object>> solicitudMalFormada(Exception e) {
		return respuesta(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA",
				"No pudimos leer la solicitud. Revisa los datos enviados.");
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, Object>> archivoMuyGrande(MaxUploadSizeExceededException e) {
		Map<String, Object> cuerpo = cuerpo(HttpStatus.PAYLOAD_TOO_LARGE, "ARCHIVO_MUY_GRANDE",
				"Solo se aceptan PDF o Word de hasta 10 MB. Puedes enviar sin CV.");
		cuerpo.put("errores", Map.of("cv", "Solo se aceptan PDF o Word de hasta 10 MB. Puedes enviar sin CV."));
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(cuerpo);
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Map<String, Object>> conflicto(DataIntegrityViolationException e) {
		return respuesta(HttpStatus.CONFLICT, "CONFLICTO", "El registro ya existe o entra en conflicto con otro.");
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<Map<String, Object>> sinPermiso(AccessDeniedException e) {
		return respuesta(HttpStatus.FORBIDDEN, "SIN_PERMISO", "Tu rol no permite realizar esta acción.");
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<Map<String, Object>> rutaInexistente(NoResourceFoundException e) {
		return respuesta(HttpStatus.NOT_FOUND, "NO_ENCONTRADO", "La ruta solicitada no existe.");
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<Map<String, Object>> metodoNoPermitido(HttpRequestMethodNotSupportedException e) {
		return respuesta(HttpStatus.METHOD_NOT_ALLOWED, "METODO_NO_PERMITIDO",
				"El método HTTP no está permitido para esta ruta.");
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> inesperado(Exception e) {
		log.error("Error inesperado", e);
		return respuesta(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
				"Ocurrió un error inesperado. Inténtalo nuevamente en unos minutos.");
	}
}
