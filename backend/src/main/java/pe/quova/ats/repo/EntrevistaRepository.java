package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import pe.quova.ats.model.Entrevista;
import pe.quova.ats.model.Enums.EstadoEntrevista;

public interface EntrevistaRepository extends JpaRepository<Entrevista, Long> {

	@Query("select e from Entrevista e join fetch e.candidato c join fetch c.vacante v join fetch v.cargo "
			+ "left join fetch v.tienda order by e.fechaHora, e.id")
	List<Entrevista> buscarTodas();

	boolean existsByCandidatoIdAndEstado(Long candidatoId, EstadoEntrevista estado);
}
