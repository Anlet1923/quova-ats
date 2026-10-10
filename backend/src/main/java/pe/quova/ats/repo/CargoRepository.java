package pe.quova.ats.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Cargo;

public interface CargoRepository extends JpaRepository<Cargo, Long> {

	List<Cargo> findAllByOrderByIdAsc();
}
