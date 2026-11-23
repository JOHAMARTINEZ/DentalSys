package cl.dentalsys.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Horas de un día para un odontólogo en una sucursal.
 * - horarioConfigurado = false: el odontólogo no tiene horario ese día
 *   en esa sucursal (no se puede reservar).
 * - bloques: cada inicio posible (cada 30 minutos) y si está libre.
 */
public record DisponibilidadResponse(
        LocalDate fecha,
        int duracionMinutos,
        boolean horarioConfigurado,
        List<Bloque> bloques
) {

    public record Bloque(
            String hora,
            boolean disponible
    ) {
    }
}
