package pe.quova.ats.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Enums.Rol;
import pe.quova.ats.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByCorreoIgnoreCase(String correo);

	List<Usuario> findByRolAndActivoTrue(Rol rol);

	List<Usuario> findAllByOrderByNombreAsc();

	boolean existsByCorreoIgnoreCase(String correo);

	boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);
}
