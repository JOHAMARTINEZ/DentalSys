package cl.dentalsys.dto;

/**
 * Cambio de contraseña hecho por el propio usuario.
 */
public record CambioClaveRequest(
        String actual,
        String nueva
) {
}
