package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Algo que el paciente tiene por pagar: un presupuesto ACEPTADO con saldo
 * o una atención CERRADA con saldo. tipo: PRESUPUESTO o ATENCION.
 */
public record PendientePagoResponse(
        String tipo,
        Integer id,
        String descripcion,
        LocalDateTime fecha,
        BigDecimal total,
        BigDecimal pagado,
        BigDecimal saldo
) {
}
