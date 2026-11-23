package cl.dentalsys.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Atención clínica (borrador). Si viene idCita, el paciente y la sucursal
 * se toman de la cita; si no, se exige idPaciente e idSucursal.
 * Las piezas dentales son opcionales (código FDI, ej: "11", "36", "55").
 */
public record AtencionRequest(
        Integer idCita,
        Integer idPaciente,
        Integer idSucursal,
        String diagnostico,
        String observaciones,
        String indicaciones,
        List<TratamientoAplicado> tratamientos
) {

    public record TratamientoAplicado(
            Integer idTratamiento,
            Integer cantidad,
            BigDecimal costoAplicado,
            List<PiezaDental> piezas
    ) {
    }

    public record PiezaDental(
            String pieza,
            String superficies,
            String observacion
    ) {
    }
}
