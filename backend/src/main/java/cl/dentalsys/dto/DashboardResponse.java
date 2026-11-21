package cl.dentalsys.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Resumen para la página de Inicio de gestión.
 * Todos los números se calculan desde la base de datos.
 * Para un ODONTOLOGO, citas, atenciones y presupuestos son solo los suyos.
 * usuariosActivos solo se informa al ADMIN (para el resto es null).
 */
public record DashboardResponse(
        long pacientesActivos,
        long citasHoy,
        long citasPorConfirmar,
        long atencionesHoy,
        long presupuestosPendientes,
        long odontologosActivos,
        Long usuariosActivos,
        List<CitaDelDia> citasDelDia
) {

    public record CitaDelDia(
            Integer idCita,
            LocalDateTime fechaHora,
            LocalDateTime fechaHoraFin,
            String paciente,
            String odontologo,
            String sucursal,
            String tipoAtencion,
            String estado
    ) {
    }
}
