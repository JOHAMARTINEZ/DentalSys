package cl.dentalsys.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Datos del paciente con sesión y sus preferencias de notificación.
 */
public record PerfilResponse(
        String rut,
        String nombres,
        String apellidos,
        LocalDate fechaNacimiento,
        String telefono,
        String correo,
        String direccion,
        String username,
        boolean emailHabilitado,
        boolean whatsappHabilitado,
        String canalPreferido,
        LocalDateTime fechaConsentimientoEmail,
        LocalDateTime fechaConsentimientoWhatsapp
) {
}
