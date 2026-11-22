package cl.dentalsys.dto;

/**
 * Indica si el asistente está disponible (si existe la clave GEMINI_API_KEY).
 * Nunca se envía la clave al frontend.
 */
public record AsistenteEstadoResponse(
        boolean configurado,
        String modelo
) {
}
