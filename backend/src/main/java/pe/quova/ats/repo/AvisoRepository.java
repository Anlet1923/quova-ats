package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Aviso;

public interface AvisoRepository extends JpaRepository<Aviso, Long> {

	List<Aviso> findTop20ByOrderByCreadoEnDesc();

	List<Aviso> findTop20ByTiendaIdOrderByCreadoEnDesc(Long tiendaId);
}
