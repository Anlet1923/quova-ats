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

/** Registro de cada cambio de etapa: quién movió a quién, de dónde a dónde y cuándo. */
@Entity
@Table(name = "historial_etapa")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistorialEtapa {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "candidato_id")
	private Candidato candidato;

	/** Nulo cuando la postulación entra al sistema. */
	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private Etapa etapaOrigen;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Etapa etapaDestino;

	/** Nulo cuando el cambio lo origina el portal público (postulación). */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "usuario_id")
	private Usuario usuario;

	@Column(nullable = false)
	private LocalDateTime fecha;

	@Column(length = 500)
	private String comentario;
}
