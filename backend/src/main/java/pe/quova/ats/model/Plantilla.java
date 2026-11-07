package pe.quova.ats.model;

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

@Entity
@Table(name = "plantilla")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plantilla {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 80)
	private String nombre;

	@Column(nullable = false, length = 40)
	private String canal;

	@Column(nullable = false, length = 80)
	private String momento;

	@Column(nullable = false, length = 1000)
	private String mensaje;
}
