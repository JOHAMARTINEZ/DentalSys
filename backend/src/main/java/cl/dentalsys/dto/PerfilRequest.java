package cl.dentalsys.dto;

/**
 * Datos de contacto que el paciente puede actualizar.
 * El correo es obligatorio porque también identifica su cuenta.
 */
public record PerfilRequest(
        String telefono,
        String correo,
        String direccion
) {
}
