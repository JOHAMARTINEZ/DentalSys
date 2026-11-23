package cl.dentalsys.dto;

/**
 * Datos de la ficha clínica que edita el odontólogo. Todos son opcionales.
 */
public record FichaRequest(
        String antecedentesMedicos,
        String alergias,
        String observaciones
) {
}
