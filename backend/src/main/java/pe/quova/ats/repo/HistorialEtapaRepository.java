package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import pe.quova.ats.model.Etapa;
import pe.quova.ats.model.HistorialEtapa;

public interface HistorialEtapaRepository extends JpaRepository<HistorialEtapa, Long> {

	@Query("select h from HistorialEtapa h left join fetch h.usuario where h.candidato.id = :candidatoId "
			+ "order by h.fecha asc, h.id asc")
	List<HistorialEtapa> buscarPorCandidato(@Param("candidatoId") Long candidatoId);

	@Query("select h from HistorialEtapa h join fetch h.candidato c join fetch c.vacante v left join fetch v.tienda "
			+ "where h.etapaDestino = :etapa")
	List<HistorialEtapa> buscarPorEtapaDestino(@Param("etapa") Etapa etapa);
}
