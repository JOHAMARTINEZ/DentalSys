package cl.dentalsys.repository;

import cl.dentalsys.model.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Las consultas para mostrar citas (con nombres de paciente, odontólogo, etc.)
 * están en CitaService con SQL directo. Aquí solo quedan las validaciones.
 */
public interface CitaRepository extends JpaRepository<Cita, Integer> {

    /**
     * Cuenta las citas que ocupan horario (todas menos CANCELADA) del odontólogo
     * y que se cruzan con [inicio, fin). Se devuelve un número (no boolean)
     * porque los boolean se guardan como TINYINT en esta base. Se excluye la cita indicada
     * (útil al reprogramar; usar 0 para no excluir ninguna).
     */
    @Query("""
            SELECT COUNT(c)
            FROM Cita c
            WHERE c.odontologo.idUsuario = :idOdontologo
              AND c.estado <> cl.dentalsys.model.EstadoCita.CANCELADA
              AND c.fechaHora < :fin
              AND c.fechaHoraFin > :inicio
              AND c.idCita <> :excluir
            """)
    long contarCrucesOdontologo(
            @Param("idOdontologo") Integer idOdontologo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("excluir") Integer excluir
    );

    /** Igual que la anterior, pero para el paciente (no puede tener dos citas a la vez). */
    @Query("""
            SELECT COUNT(c)
            FROM Cita c
            WHERE c.paciente.idPaciente = :idPaciente
              AND c.estado <> cl.dentalsys.model.EstadoCita.CANCELADA
              AND c.fechaHora < :fin
              AND c.fechaHoraFin > :inicio
              AND c.idCita <> :excluir
            """)
    long contarCrucesPaciente(
            @Param("idPaciente") Integer idPaciente,
            @Param("inicio") LocalDateTime inicio,
            @Param("fin") LocalDateTime fin,
            @Param("excluir") Integer excluir
    );

    /** Citas del odontólogo (no canceladas) que se cruzan con un periodo. */
    @Query("""
            SELECT c
            FROM Cita c
            WHERE c.odontologo.idUsuario = :idOdontologo
              AND c.estado <> cl.dentalsys.model.EstadoCita.CANCELADA
              AND c.fechaHora < :hasta
              AND c.fechaHoraFin > :desde
            """)
    List<Cita> ocupadasEnPeriodo(
            @Param("idOdontologo") Integer idOdontologo,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );
}
