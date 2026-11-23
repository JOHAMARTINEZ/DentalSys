package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Resumen del inicio del portal del paciente (todo calculado desde la base).
 */
public record PortalResumenResponse(
        String nombres,
        String apellidos,
        CitaResponse proximaCita,
        long citasProximas,
        long presupuestosPorResponder,
        BigDecimal saldoPendiente,
        LocalDateTime ultimaAtencion,
        long atencionesCerradas
) {
}
