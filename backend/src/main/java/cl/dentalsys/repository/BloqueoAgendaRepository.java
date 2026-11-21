package cl.dentalsys.repository;

import cl.dentalsys.model.BloqueoAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BloqueoAgendaRepository extends JpaRepository<BloqueoAgenda, Integer> {

    // Bloqueos activos de un odontólogo en una sucursal que se cruzan con un periodo
    @Query("""
            SELECT b
            FROM BloqueoAgenda b
            WHERE b.idOdontologo = :idOdontologo
              AND b.idSucursal = :idSucursal
              AND b.estado = true
              AND b.fechaHoraInicio < :hasta
              AND b.fechaHoraFin > :desde
            """)
    List<BloqueoAgenda> buscarCruces(
            @Param("idOdontologo") Integer idOdontologo,
            @Param("idSucursal") Integer idSucursal,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );

    // Bloqueos activos que terminan después de una fecha (vigentes o futuros)
    @Query("""
            SELECT b
            FROM BloqueoAgenda b
            WHERE b.estado = true
              AND b.fechaHoraFin >= :desde
            ORDER BY b.fechaHoraInicio ASC
            """)
    List<BloqueoAgenda> buscarVigentes(@Param("desde") LocalDateTime desde);
}
