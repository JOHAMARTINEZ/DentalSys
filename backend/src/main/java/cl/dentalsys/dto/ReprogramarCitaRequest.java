package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * Nueva fecha/hora de una cita. Si idOdontologo o idSucursal vienen vacíos,
 * se mantienen los de la cita.
 */
public record ReprogramarCitaRequest(
        LocalDateTime fechaHora,
        Integer idOdontologo,
        Integer idSucursal,
        String observacion
) {
}
