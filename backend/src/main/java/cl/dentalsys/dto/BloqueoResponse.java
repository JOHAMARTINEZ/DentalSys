package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * citasAfectadas: citas no canceladas que ya existían en ese periodo
 * (hay que reprogramarlas o cancelarlas desde la agenda).
 */
public record BloqueoResponse(
        Integer idBloqueo,
        Integer idOdontologo,
        String odontologoNombre,
        Integer idSucursal,
        String sucursalNombre,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        String motivo,
        long citasAfectadas
) {
}
