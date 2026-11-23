package cl.dentalsys.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Presupuesto que emite el odontólogo. Los tratamientos usan el mismo formato
 * que las atenciones (cantidad, costo aplicado y piezas dentales opcionales).
 * El monto total se calcula en el backend.
 */
public record PresupuestoRequest(
        Integer idPaciente,
        Integer idSucursal,
        LocalDate fechaVencimiento,
        List<AtencionRequest.TratamientoAplicado> tratamientos
) {
}
