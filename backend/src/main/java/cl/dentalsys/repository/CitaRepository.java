package cl.dentalsys.repository;

import cl.dentalsys.model.Cita;
import cl.dentalsys.model.EstadoCita;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CitaRepository extends JpaRepository<Cita, Integer> {

    List<Cita> findByFechaHoraBetween(
            LocalDateTime inicio,
            LocalDateTime fin
    );

    List<Cita> findByPacienteIdPaciente(Integer idPaciente);

    List<Cita> findByOdontologoIdUsuario(Integer idUsuario);

    List<Cita> findBySucursalIdSucursal(Integer idSucursal);
     boolean existsByOdontologoIdUsuarioAndFechaHoraAndEstadoIn(
            Integer idUsuario,
            LocalDateTime fechaHora,
            List<EstadoCita> estados
    );

}