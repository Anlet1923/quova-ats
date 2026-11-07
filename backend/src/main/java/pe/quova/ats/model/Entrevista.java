package pe.quova.ats.model;

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
import pe.quova.ats.model.Enums.EstadoEntrevista;
import pe.quova.ats.model.Enums.ResultadoEntrevista;

@Entity
@Table(name = "entrevista")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entrevista {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "candidato_id")
	private Candidato candidato;

	@Column(nullable = false)
	private LocalDateTime fechaHora;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	@Builder.Default
	private EstadoEntrevista estado = EstadoEntrevista.PENDIENTE;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private ResultadoEntrevista resultado;

	private Integer estrellas;
}
