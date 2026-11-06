package cl.dentalsys.repository;

import cl.dentalsys.model.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Integer> {

    Optional<Paciente> findByRut(String rut);

    boolean existsByRut(String rut);
}