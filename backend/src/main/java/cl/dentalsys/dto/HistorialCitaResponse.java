package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * Un cambio en la historia de una cita (tabla historial_cita).
 * usuario: nombre de quien hizo el cambio, o null si fue una reserva online.
 */
public record HistorialCitaResponse(
        Integer idHistorial,
        String estadoAnterior,
        String estadoNuevo,
        LocalDateTime fechaCambio,
        String usuario,
        String observacion
) {
}
