package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Tienda;

public interface TiendaRepository extends JpaRepository<Tienda, Long> {

	List<Tienda> findAllByOrderByNombreAsc();
}
