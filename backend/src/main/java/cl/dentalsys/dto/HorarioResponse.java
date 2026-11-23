package cl.dentalsys.dto;

import java.time.LocalTime;

public record HorarioResponse(
        Integer idHorario,
        Integer idOdontologo,
        String odontologoNombre,
        Integer idSucursal,
        String sucursalNombre,
        Integer diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin,
        boolean activo
) {
}
