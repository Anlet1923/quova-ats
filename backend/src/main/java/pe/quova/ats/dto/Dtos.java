package pe.quova.ats.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import pe.quova.ats.model.Enums.DisponibilidadInicio;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Fuente;
import pe.quova.ats.model.Enums.MotivoDescarte;
import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Enums.Turno;
import pe.quova.ats.model.Etapa;

/** Objetos de entrada y salida de la API. */
public final class Dtos {

	private Dtos() {
	}

	// ---------- Autenticación ----------

	public record LoginRequest(
			@NotBlank(message = "Ingresa tu correo corporativo.")
			@Pattern(regexp = "(?i)^[\\w.+-]+@quova\\.pe$", message = "Usa tu correo corporativo @quova.pe.")
			String correo,
			@NotBlank(message = "Ingresa tu contraseña.") String password) {
	}

	public record UsuarioDto(Long id, String nombre, String correo, Rol rol, Long tiendaId, String tienda) {
	}

	public record LoginResponse(String token, UsuarioDto usuario) {
	}

	// ---------- Catálogos ----------

	public record TiendaDto(Long id, String nombre, String direccion, String distrito, boolean activa) {
	}

	public record CargoDto(Long id, String nombre, BigDecimal salarioBase, String descripcion, String requisitos) {
	}

	// ---------- Vacantes ----------

	public record VacanteRequest(
			@NotNull(message = "Elige el cargo de la vacante.") Long cargoId,
			Long tiendaId,
			Turno turno,
			@Min(value = 1, message = "Indica al menos 1 puesto.") Integer puestos,
			@Positive(message = "El salario debe ser mayor a cero.") BigDecimal salario,
			@Future(message = "La fecha de cierre debe ser posterior a hoy.") LocalDate fechaCierre,
			@Size(max = 1000, message = "La descripción admite hasta 1000 caracteres.") String descripcion,
			@Size(max = 1000, message = "Los requisitos admiten hasta 1000 caracteres.") String requisitos,
			boolean urgente,
			boolean publicar,
			boolean crearIgualmente) {
	}

	public record VacanteDto(Long id, String titulo, Long cargoId, String cargo, Long tiendaId, String tienda,
			Turno turno, Integer puestos, BigDecimal salario, LocalDate fechaCierre, String descripcion,
			String requisitos, boolean urgente, EstadoVacante estado, String token, LocalDateTime creadaEn,
			long candidatos) {
	}

	public record VacantePublicaDto(String token, String titulo, String cargo, String tienda, String distrito,
			String direccion, Turno turno, BigDecimal salario, String descripcion, String requisitos,
			LocalDate fechaCierre) {
	}

	// ---------- Postulación ----------

	public record PostulacionRequest(
			@NotBlank(message = "Escribe tu nombre y apellido.")
			@Pattern(regexp = "^\\s*[\\p{L}'.-]+(\\s+[\\p{L}'.-]+)+\\s*$", message = "Escribe tu nombre y apellido (solo letras).")
			@Size(max = 120, message = "El nombre admite hasta 120 caracteres.")
			String nombre,
			@NotNull(message = "El DNI debe tener 8 dígitos numéricos.")
			@Pattern(regexp = "^\\d{8}$", message = "El DNI debe tener 8 dígitos numéricos.")
			String dni,
			@NotNull(message = "Ingresa un celular de 9 dígitos que empiece con 9.")
			@Pattern(regexp = "^9\\d{8}$", message = "Ingresa un celular de 9 dígitos que empiece con 9.")
			String celular,
			@Email(message = "Revisa el formato del correo (ej.: juan@correo.com).")
			@Size(max = 120, message = "El correo admite hasta 120 caracteres.")
			String correo,
			@NotBlank(message = "Indica tu distrito de residencia.")
			@Size(max = 80, message = "El distrito admite hasta 80 caracteres.")
			String distrito,
			@NotNull(message = "Indica cuándo puedes empezar.") DisponibilidadInicio inicio,
			@NotEmpty(message = "Elige al menos un turno.") Set<Turno> turnos,
			@NotNull(message = "Indica si tienes experiencia en retail.") Boolean experienciaRetail,
			@Size(max = 60, message = "Usa una de las opciones de tiempo de experiencia.") String tiempoExperiencia,
			@NotNull(message = "Cuéntanos un poco más (mínimo 20 caracteres).")
			@Size(min = 20, max = 600, message = "Cuéntanos un poco más (mínimo 20 caracteres).")
			String motivacion,
			@NotNull(message = "Cuéntanos un poco más (mínimo 20 caracteres).")
			@Size(min = 20, max = 600, message = "Cuéntanos un poco más (mínimo 20 caracteres).")
			String atencionAfluencia,
			@NotNull(message = "Indica si puedes trabajar en otros locales.") Boolean otrosLocales,
			@NotNull(message = "Para enviar, acepta el tratamiento de tus datos.")
			@AssertTrue(message = "Para enviar, acepta el tratamiento de tus datos.")
			Boolean consentimiento) {
	}

	public record PostulacionCreadaDto(Long id, String nombre, String vacante, String tienda, LocalDateTime fecha) {
	}

	public record DniDisponibleDto(boolean disponible) {
	}

	// ---------- Pipeline ----------

	public record CandidatoDto(Long id, String nombre, String celular, Long vacanteId, String vacante, Long tiendaId,
			String tienda, String cargo, Fuente fuente, Etapa etapa, long diasEnEtapa, LocalDateTime etapaDesde,
			LocalDateTime creadoEn, boolean bancoTalento, MotivoDescarte motivoDescarte) {
	}

	public record MoverRequest(@NotNull(message = "Indica la etapa de destino.") Etapa etapaDestino) {
	}

	public record DescartarRequest(
			@NotNull(message = "Elige un motivo de descarte.") MotivoDescarte motivo,
			@Size(max = 500, message = "El comentario admite hasta 500 caracteres.") String comentario,
			boolean bancoTalento) {
	}

	public record HistorialDto(LocalDateTime fecha, Etapa etapaOrigen, Etapa etapaDestino, String usuario,
			String comentario) {
	}

	// ---------- Dashboard ----------

	/** {@code favorable} es nulo cuando no hubo cambio: el color depende de si el cambio conviene, no de su signo. */
	public record TarjetaDto(String clave, String titulo, String valor, String variacion, Boolean favorable,
			String detalle) {
	}

	public record SerieDto(String nombre, long total) {
	}

	public record DashboardDto(List<TarjetaDto> tarjetas, List<SerieDto> candidatosPorEtapa,
			List<SerieDto> vacantesPorTienda, String periodo) {
	}
}
