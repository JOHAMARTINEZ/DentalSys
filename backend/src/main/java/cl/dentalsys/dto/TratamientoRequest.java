package cl.dentalsys.dto;

import java.math.BigDecimal;

/**
 * Tratamiento del catálogo (tabla tratamiento).
 * costoBase: precio de referencia; en cada atención o presupuesto
 * se puede aplicar otro valor (costo_aplicado).
 */
public record TratamientoRequest(
        String nombre,
        String descripcion,
        BigDecimal costoBase
) {
}
