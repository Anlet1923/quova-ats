package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Plantilla;

public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {

	List<Plantilla> findAllByOrderByNombreAsc();

	boolean existsByNombreIgnoreCase(String nombre);

	boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
}
