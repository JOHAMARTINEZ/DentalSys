package cl.dentalsys.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Paciente tal como se muestra en la gestión.
 * Incluye un pequeño resumen de sus citas y si tiene cuenta en el portal.
 */
public record PacienteResponse(
        Integer idPaciente,
        String rut,
        String nombres,
        String apellidos,
        LocalDate fechaNacimiento,
        Integer edad,
        String telefono,
        String correo,
        String direccion,
        String apoderadoNombre,
        String apoderadoRut,
        String apoderadoTelefono,
        boolean activo,
        boolean tieneCuenta,
        String usuarioCuenta,
        long totalCitas,
        LocalDateTime proximaCita,
        LocalDateTime ultimaCitaCompletada
) {
}
