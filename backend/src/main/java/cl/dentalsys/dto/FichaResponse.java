package cl.dentalsys.dto;

import java.time.LocalDate;

/**
 * Ficha clínica de un paciente junto a sus datos básicos.
 * Si el paciente aún no tiene ficha, idFicha y fechaApertura vienen en null.
 */
public record FichaResponse(
        Integer idFicha,
        LocalDate fechaApertura,
        String antecedentesMedicos,
        String alergias,
        String observaciones,
        Integer idPaciente,
        String pacienteNombre,
        String rut,
        LocalDate fechaNacimiento,
        Integer edad,
        String telefono,
        String correo,
        String apoderadoNombre,
        boolean pacienteActivo
) {
}
