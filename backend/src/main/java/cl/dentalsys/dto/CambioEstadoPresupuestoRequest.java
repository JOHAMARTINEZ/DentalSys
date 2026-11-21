package cl.dentalsys.dto;

/**
 * estado: ACEPTADO, RECHAZADO o ANULADO.
 */
public record CambioEstadoPresupuestoRequest(
        String estado
) {
}
