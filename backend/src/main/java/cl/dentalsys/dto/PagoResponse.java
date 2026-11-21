package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Pago con su comprobante. concepto: texto descriptivo
 * (ej: "Presupuesto N° 3" o "Atención del 23-11-2026").
 */
public record PagoResponse(
        Integer idPago,
        LocalDateTime fechaHora,
        BigDecimal monto,
        String medioPago,
        String estado,
        Integer idPaciente,
        String pacienteNombre,
        String pacienteRut,
        Integer idPresupuesto,
        Integer idAtencion,
        String concepto,
        String observacion,
        String registradoPor,
        LocalDateTime fechaAnulacion,
        String anuladoPor,
        String motivoAnulacion,
        String folio,
        String estadoComprobante,
        String sucursalNombre,
        String sucursalDireccion
) {
}
