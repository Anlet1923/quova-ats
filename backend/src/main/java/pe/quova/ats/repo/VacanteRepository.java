package pe.quova.ats.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.quova.ats.model.Enums.EstadoVacante;
import pe.quova.ats.model.Enums.Turno;
import pe.quova.ats.model.Vacante;

public interface VacanteRepository extends JpaRepository<Vacante, Long> {

	@Query("select v from Vacante v join fetch v.cargo left join fetch v.tienda order by v.creadaEn desc, v.id desc")
	List<Vacante> buscarTodasConDetalle();

	@Query("select v from Vacante v join fetch v.cargo left join fetch v.tienda where v.id = :id")
	Optional<Vacante> buscarConDetalle(@Param("id") Long id);

	@Query("select v from Vacante v join fetch v.cargo left join fetch v.tienda where v.token = :token")
	Optional<Vacante> buscarPorToken(@Param("token") String token);

	boolean existsByToken(String token);

	List<Vacante> findByTiendaIdAndCargoIdAndTurnoAndEstado(Long tiendaId, Long cargoId, Turno turno,
			EstadoVacante estado);
}
