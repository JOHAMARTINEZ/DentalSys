package cl.dentalsys.dto;

import java.time.LocalDateTime;

/**
 * Cita tal como se muestra en la agenda y en el portal del paciente.
 * creadaPor: nombre de quien la registró, o null si fue una reserva online.
 * idAtencion / estadoAtencion: atención clínica registrada para la cita (o null).
 */
public record CitaResponse(
        Integer idCita,
        LocalDateTime fechaHora,
        LocalDateTime fechaHoraFin,
        String estado,
        String comentario,
        Integer idMotivo,
        String tipoAtencion,
        Integer idPaciente,
        String pacienteNombre,
        String pacienteRut,
        String pacienteTelefono,
        String pacienteCorreo,
        Integer idOdontologo,
        String odontologoNombre,
        String especialidad,
        Integer idSucursal,
        String sucursalNombre,
        String sucursalDireccion,
        LocalDateTime fechaCreacion,
        String creadaPor,
        Integer idAtencion,
        String estadoAtencion
) {
}
