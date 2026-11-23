package cl.dentalsys.dto;

import java.time.LocalDate;

/**
 * Registro de cuenta de paciente desde la página pública.
 * Si el RUT ya existe como paciente (por ejemplo, reservó sin cuenta),
 * la fecha de nacimiento debe coincidir para enlazar la cuenta.
 */
public record RegistroRequest(
        String rut,
        String nombres,
        String apellidos,
        LocalDate fechaNacimiento,
        String telefono,
        String correo,
        String username,
        String password
) {
}
