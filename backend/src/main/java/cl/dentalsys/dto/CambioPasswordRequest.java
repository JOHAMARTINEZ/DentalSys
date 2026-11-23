package cl.dentalsys.dto;

/**
 * Nueva contraseña de un usuario (la asigna el ADMIN).
 */
public record CambioPasswordRequest(
        String password
) {
}
