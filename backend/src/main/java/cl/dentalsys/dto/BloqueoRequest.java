package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * Periodo sin atención. Si idSucursal viene vacío, el bloqueo se crea
 * en todas las sucursales donde atiende el odontólogo.
 */
public record BloqueoRequest(
        Integer idOdontologo,
        Integer idSucursal,
        LocalDateTime fechaHoraInicio,
        LocalDateTime fechaHoraFin,
        String motivo
) {
}
