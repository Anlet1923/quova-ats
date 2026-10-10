package pe.quova.ats.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.quova.ats.model.Candidato;

public interface CandidatoRepository extends JpaRepository<Candidato, Long> {

	boolean existsByVacanteIdAndDni(Long vacanteId, String dni);

	@Query("select c from Candidato c join fetch c.vacante v join fetch v.cargo left join fetch v.tienda "
			+ "order by c.etapaDesde desc, c.id desc")
	List<Candidato> buscarTodosConDetalle();

	@Query("select c from Candidato c join fetch c.vacante v join fetch v.cargo left join fetch v.tienda "
			+ "where c.id = :id")
	Optional<Candidato> buscarConDetalle(@Param("id") Long id);

	@Query("select c.vacante.id, count(c) from Candidato c group by c.vacante.id")
	List<Object[]> contarPorVacante();
}
