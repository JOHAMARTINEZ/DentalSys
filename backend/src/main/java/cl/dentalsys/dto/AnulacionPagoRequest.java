package cl.dentalsys.dto;

/**
 * Motivo obligatorio para anular un pago (queda en la trazabilidad).
 */
public record AnulacionPagoRequest(
        String motivo
) {
}
