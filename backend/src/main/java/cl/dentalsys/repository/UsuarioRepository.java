package cl.dentalsys.repository;

import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByUsername(String username);

    Optional<Usuario> findByCorreo(String correo);

    Optional<Usuario> findByRut(String rut);

    List<Usuario> findAllByOrderByNombresAscApellidosAsc();

    long countByRolAndEstado(Rol rol, Integer estado);
}
