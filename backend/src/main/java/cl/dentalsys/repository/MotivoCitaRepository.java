package cl.dentalsys.repository;

import cl.dentalsys.model.MotivoCita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MotivoCitaRepository extends JpaRepository<MotivoCita, Integer> {

    List<MotivoCita> findByEstadoTrueOrderByNombreAsc();
}