package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Atención clínica con sus tratamientos y piezas dentales.
 * estado: BORRADOR (editable) o CERRADA (no se modifica).
 */
public record AtencionResponse(
        Integer idAtencion,
        LocalDateTime fechaHora,
        String estado,
        String diagnostico,
        String observaciones,
        String indicaciones,
        Integer idCita,
        LocalDateTime fechaCita,
        Integer idPaciente,
        String pacienteNombre,
        Integer idOdontologo,
        String odontologoNombre,
        Integer idSucursal,
        String sucursalNombre,
        BigDecimal total,
        List<TratamientoDetalle> tratamientos
) {

    public record TratamientoDetalle(
            Integer idTratamiento,
            String nombre,
            int cantidad,
            BigDecimal costoAplicado,
            BigDecimal subtotal,
            List<AtencionRequest.PiezaDental> piezas
    ) {
    }
}
