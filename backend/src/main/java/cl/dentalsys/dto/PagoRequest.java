package cl.dentalsys.dto;

import java.math.BigDecimal;

/**
 * Pago (abono) a un presupuesto aceptado o a una atención cerrada.
 * Debe venir exactamente uno de los dos: idPresupuesto o idAtencion.
 * medioPago: EFECTIVO, TARJETA o TRANSFERENCIA.
 */
public record PagoRequest(
        Integer idPresupuesto,
        Integer idAtencion,
        BigDecimal monto,
        String medioPago,
        String observacion
) {
}
