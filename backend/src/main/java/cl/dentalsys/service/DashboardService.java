package cl.dentalsys.service;

import cl.dentalsys.dto.DashboardResponse;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Calcula los números de la página de Inicio directamente con SQL
 * (conteos simples sobre las tablas de dentalsys_v2).
 */
@Service
public class DashboardService {

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;

    public DashboardService(
            JdbcTemplate jdbcTemplate,
            UsuarioRepository usuarioRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse resumen(String username) {

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario no encontrado"
                ));

        boolean esOdontologo = usuario.getRol() == Rol.ODONTOLOGO;
        boolean esAdmin = usuario.getRol() == Rol.ADMIN;

        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia = inicioDia.plusDays(1);
        Timestamp desde = Timestamp.valueOf(inicioDia);
        Timestamp hasta = Timestamp.valueOf(finDia);
        Timestamp ahora = Timestamp.valueOf(LocalDateTime.now());

        // Filtro por odontólogo (solo cuando el usuario es odontólogo)
        String filtroCita = esOdontologo ? " AND c.id_odontologo = ?" : "";
        String filtroAtencion = esOdontologo ? " AND id_odontologo = ?" : "";

        long pacientesActivos = contar(
                "SELECT COUNT(*) FROM paciente WHERE estado = 1"
        );

        long citasHoy = contar(
                "SELECT COUNT(*) FROM cita c "
                        + "WHERE c.fecha_hora >= ? AND c.fecha_hora < ? "
                        + "AND c.estado <> 'CANCELADA'" + filtroCita,
                parametros(esOdontologo, usuario.getIdUsuario(), desde, hasta)
        );

        // Citas futuras que aún no se confirman
        long citasPorConfirmar = contar(
                "SELECT COUNT(*) FROM cita c "
                        + "WHERE c.fecha_hora >= ? AND c.estado = 'RESERVADA'" + filtroCita,
                parametros(esOdontologo, usuario.getIdUsuario(), ahora)
        );

        long atencionesHoy = contar(
                "SELECT COUNT(*) FROM atencion "
                        + "WHERE fecha_hora >= ? AND fecha_hora < ?" + filtroAtencion,
                parametros(esOdontologo, usuario.getIdUsuario(), desde, hasta)
        );

        long presupuestosPendientes = contar(
                "SELECT COUNT(*) FROM presupuesto WHERE estado = 'PENDIENTE'" + filtroAtencion,
                parametros(esOdontologo, usuario.getIdUsuario())
        );

        long odontologosActivos = contar(
                "SELECT COUNT(*) FROM odontologo o "
                        + "JOIN usuario u ON u.id_usuario = o.id_usuario "
                        + "WHERE u.estado = 1 AND o.estado = 1"
        );

        Long usuariosActivos = esAdmin
                ? contar("SELECT COUNT(*) FROM usuario WHERE estado = 1")
                : null;

        List<DashboardResponse.CitaDelDia> citasDelDia = jdbcTemplate.query(
                "SELECT c.id_cita, c.fecha_hora, c.fecha_hora_fin, c.estado, "
                        + "CONCAT(p.nombres, ' ', p.apellidos) AS paciente, "
                        + "CONCAT(u.nombres, ' ', u.apellidos) AS odontologo, "
                        + "s.nombre AS sucursal, "
                        + "m.nombre AS tipo_atencion "
                        + "FROM cita c "
                        + "JOIN paciente p ON p.id_paciente = c.id_paciente "
                        + "JOIN usuario u ON u.id_usuario = c.id_odontologo "
                        + "JOIN sucursal s ON s.id_sucursal = c.id_sucursal "
                        + "LEFT JOIN motivo_cita m ON m.id_motivo = c.id_motivo "
                        + "WHERE c.fecha_hora >= ? AND c.fecha_hora < ? "
                        + "AND c.estado <> 'CANCELADA'" + filtroCita
                        + " ORDER BY c.fecha_hora ASC LIMIT 12",
                (rs, fila) -> new DashboardResponse.CitaDelDia(
                        rs.getInt("id_cita"),
                        rs.getTimestamp("fecha_hora").toLocalDateTime(),
                        rs.getTimestamp("fecha_hora_fin").toLocalDateTime(),
                        rs.getString("paciente"),
                        rs.getString("odontologo"),
                        rs.getString("sucursal"),
                        rs.getString("tipo_atencion"),
                        rs.getString("estado")
                ),
                parametros(esOdontologo, usuario.getIdUsuario(), desde, hasta)
        );

        return new DashboardResponse(
                pacientesActivos,
                citasHoy,
                citasPorConfirmar,
                atencionesHoy,
                presupuestosPendientes,
                odontologosActivos,
                usuariosActivos,
                citasDelDia
        );
    }

    private long contar(String sql, Object... parametros) {
        Long total = jdbcTemplate.queryForObject(sql, Long.class, parametros);
        return total == null ? 0 : total;
    }

    /**
     * Arma los parámetros de la consulta. Si el usuario es odontólogo,
     * agrega su id al final (corresponde al filtro "id_odontologo = ?").
     */
    private Object[] parametros(
            boolean esOdontologo,
            Integer idOdontologo,
            Object... base) {

        List<Object> lista = new ArrayList<>(List.of(base));

        if (esOdontologo) {
            lista.add(idOdontologo);
        }

        return lista.toArray();
    }
}
