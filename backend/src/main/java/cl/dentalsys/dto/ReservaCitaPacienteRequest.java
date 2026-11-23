package cl.dentalsys.dto;

import java.time.LocalDateTime;

public record ReservaCitaPacienteRequest(
        Integer idOdontologo,
        Integer idSucursal,
        // Tipo de atención (tabla motivo_cita). Opcional.
        Integer idMotivo,
        LocalDateTime fechaHora,
        String motivo
) {
}