package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * Nueva cita creada desde la agenda (recepción / administración).
 * idMotivo (tipo de atención) y comentario son opcionales.
 */
public record CitaRequest(
        Integer idPaciente,
        Integer idOdontologo,
        Integer idSucursal,
        Integer idMotivo,
        LocalDateTime fechaHora,
        String comentario
) {
}
