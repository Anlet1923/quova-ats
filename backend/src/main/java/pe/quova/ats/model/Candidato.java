package pe.quova.ats.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.quova.ats.model.Enums.DisponibilidadInicio;
import pe.quova.ats.model.Enums.Fuente;
import pe.quova.ats.model.Enums.MotivoDescarte;
import pe.quova.ats.model.Enums.Turno;

/** Postulación de un candidato a una vacante. El mismo DNI no puede repetirse en la misma vacante. */
@Entity
@Table(name = "candidato", uniqueConstraints = @UniqueConstraint(name = "uk_candidato_vacante_dni", columnNames = {
		"vacante_id", "dni" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidato {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "vacante_id")
	private Vacante vacante;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(nullable = false, length = 8)
	private String dni;

	@Column(nullable = false, length = 9)
	private String celular;

	@Column(length = 120)
	private String correo;

	@Column(nullable = false, length = 80)
	private String distrito;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private DisponibilidadInicio inicio;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "candidato_turno", joinColumns = @JoinColumn(name = "candidato_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "turno", length = 20)
	@Builder.Default
	private Set<Turno> turnos = new HashSet<>();

	private boolean experienciaRetail;

	@Column(length = 60)
	private String tiempoExperiencia;

	@Column(length = 600)
	private String motivacion;

	@Column(length = 600)
	private String atencionAfluencia;

	private boolean otrosLocales;

	@Column(length = 200)
	private String cvNombre;

	@Column(length = 300)
	private String cvRuta;

	private boolean consentimiento;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Fuente fuente;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Etapa etapa;

	/** Momento en que entró a la etapa actual; de aquí salen los "días en la etapa". */
	@Column(nullable = false)
	private LocalDateTime etapaDesde;

	@Column(nullable = false)
	private LocalDateTime creadoEn;

	@Enumerated(EnumType.STRING)
	@Column(length = 30)
	private MotivoDescarte motivoDescarte;

	@Column(length = 500)
	private String comentarioDescarte;

	private boolean bancoTalento;
}
