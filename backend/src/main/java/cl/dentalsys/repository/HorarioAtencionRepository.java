package cl.dentalsys.repository;

import cl.dentalsys.model.HorarioAtencion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioAtencionRepository extends JpaRepository<HorarioAtencion, Integer> {

    List<HorarioAtencion> findByIdOdontologoOrderByDiaSemanaAscHoraInicioAsc(Integer idOdontologo);

    List<HorarioAtencion> findAllByOrderByIdOdontologoAscDiaSemanaAscHoraInicioAsc();

    // Horarios activos de un día para un odontólogo (en todas sus sucursales)
    List<HorarioAtencion> findByIdOdontologoAndDiaSemanaAndEstadoTrue(
            Integer idOdontologo,
            Integer diaSemana
    );

    boolean existsByIdOdontologoAndEstadoTrue(Integer idOdontologo);
}
