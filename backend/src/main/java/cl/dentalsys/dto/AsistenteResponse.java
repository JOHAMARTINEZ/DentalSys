package cl.dentalsys.dto;

/**
 * Respuesta del asistente de IA.
 */
public record AsistenteResponse(
        String respuesta,
        String modelo
) {
}
