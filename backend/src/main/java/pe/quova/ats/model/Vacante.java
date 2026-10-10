package pe.quova.ats.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Turno;

@Entity
@Table(name = "vacante")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vacante {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "cargo_id")
	private Cargo cargo;

	/** Puede faltar mientras la vacante es un borrador. */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "tienda_id")
	private Tienda tienda;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private Turno turno;

	private Integer puestos;

	@Column(precision = 10, scale = 2)
	private BigDecimal salario;

	private LocalDate fechaCierre;

	@Column(length = 1000)
	private String descripcion;

	@Column(length = 1000)
	private String requisitos;

	private boolean urgente;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoVacante estado;

	/** Token del link único de postulación; se genera al publicar. */
	@Column(unique = true, length = 20)
	private String token;

	@Column(nullable = false)
	private LocalDateTime creadaEn;

	private LocalDateTime publicadaEn;

	private LocalDateTime cerradaEn;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "creada_por_id")
	private Usuario creadaPor;

	public String getTitulo() {
		return cargo.getNombre() + (tienda != null ? " · " + tienda.getNombre() : "");
	}

	/** El link deja de aceptar postulaciones al cerrar la vacante o al pasar la fecha de cierre. */
	public boolean aceptaPostulaciones() {
		return estado == EstadoVacante.ABIERTA && (fechaCierre == null || !fechaCierre.isBefore(LocalDate.now()));
	}
}
