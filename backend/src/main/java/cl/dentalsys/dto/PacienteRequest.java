package cl.dentalsys.dto;

import java.time.LocalDate;

/**
 * Datos para registrar o editar un paciente desde la gestión.
 * Teléfono, correo, dirección y apoderado son opcionales
 * (el apoderado se pide para menores de 18 años).
 */
public record PacienteRequest(
        String rut,
        String nombres,
        String apellidos,
        LocalDate fechaNacimiento,
        String telefono,
        String correo,
        String direccion,
        String apoderadoNombre,
        String apoderadoRut,
        String apoderadoTelefono
) {
}
