package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Presupuesto con su saldo (vw_saldo_presupuesto) y tratamientos.
 * Estados: PENDIENTE, ACEPTADO, RECHAZADO, VENCIDO, ANULADO.
 */
public record PresupuestoResponse(
        Integer idPresupuesto,
        LocalDate fechaEmision,
        LocalDate fechaVencimiento,
        String estado,
        BigDecimal montoTotal,
        BigDecimal totalAbonado,
        BigDecimal saldoPendiente,
        Integer idPaciente,
        String pacienteNombre,
        String pacienteRut,
        Integer idOdontologo,
        String odontologoNombre,
        Integer idSucursal,
        String sucursalNombre,
        List<AtencionResponse.TratamientoDetalle> tratamientos
) {
}
