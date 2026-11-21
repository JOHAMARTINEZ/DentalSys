package cl.dentalsys.dto;

import java.math.BigDecimal;

/**
 * usos: cuántas atenciones y presupuestos lo incluyen.
 */
public record TratamientoResponse(
        Integer idTratamiento,
        String nombre,
        String descripcion,
        BigDecimal costoBase,
        boolean activo,
        long usos
) {
}
