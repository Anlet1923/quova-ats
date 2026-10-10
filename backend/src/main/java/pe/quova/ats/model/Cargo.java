package pe.quova.ats.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Cargo de tienda; funciona como plantilla de vacante (salario base, descripción y requisitos). */
@Entity
@Table(name = "cargo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cargo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 80)
	private String nombre;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal salarioBase;

	@Column(length = 1000)
	private String descripcion;

	@Column(length = 1000)
	private String requisitos;
}
