package cl.dentalsys.dto;

import java.time.LocalTime;

/**
 * Bloque semanal de atención. diaSemana: 1 = lunes ... 7 = domingo.
 */
public record HorarioRequest(
        Integer idOdontologo,
        Integer idSucursal,
        Integer diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin
) {
}
