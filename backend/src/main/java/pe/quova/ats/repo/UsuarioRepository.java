package pe.quova.ats.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import pe.quova.ats.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByCorreoIgnoreCase(String correo);
}
