package cl.dentalsys.dto;

/**
 * Cambio de estado de una cita: CONFIRMADA, COMPLETADA, CANCELADA o NO_ASISTIO.
 * La observación es opcional y queda en el historial de la cita.
 */
public record CambioEstadoCitaRequest(
        String estado,
        String observacion
) {
}
