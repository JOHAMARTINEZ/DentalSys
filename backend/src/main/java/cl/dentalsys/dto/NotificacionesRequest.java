package cl.dentalsys.dto;

/**
 * Preferencias de notificación (tabla preferencia_notificacion).
 * canalPreferido: EMAIL, WHATSAPP o null; debe estar habilitado.
 */
public record NotificacionesRequest(
        boolean emailHabilitado,
        boolean whatsappHabilitado,
        String canalPreferido
) {
}
