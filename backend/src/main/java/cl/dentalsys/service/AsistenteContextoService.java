package cl.dentalsys.service;

import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Arma el "contexto" que recibe el asistente de IA: un resumen en texto
 * de la información ADMINISTRATIVA de la clínica, según el rol de quien pregunta.
 *
 * Privacidad (Ley 19.628 / datos sensibles de salud):
 * - NO se envían nombres, RUT, teléfonos ni correos de pacientes.
 * - NO se envían datos clínicos (diagnósticos, alergias, observaciones, odontograma).
 * - Solo se envían conteos, montos agregados, horarios, catálogo y datos del personal.
 */
@Service
public class AsistenteContextoService {

    private static final ZoneId ZONA = ZoneId.of("America/Santiago");
    private static final Locale CHILE = Locale.of("es", "CL");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final DateTimeFormatter FECHA_HORA = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private static final String[] DIAS = {
            "", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"
    };

    private final JdbcTemplate jdbc;

    public AsistenteContextoService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public String construir(Usuario usuario) {

        Rol rol = usuario.getRol();
        boolean esOdontologo = rol == Rol.ODONTOLOGO;
        boolean esAdmin = rol == Rol.ADMIN;
        boolean veCaja = rol == Rol.ADMIN || rol == Rol.RECEPCIONISTA;
        Integer idUsuario = usuario.getIdUsuario();

        LocalDateTime ahora = LocalDateTime.now(ZONA);
        LocalDate hoy = ahora.toLocalDate();
        Timestamp inicioHoy = Timestamp.valueOf(hoy.atStartOfDay());
        Timestamp finHoy = Timestamp.valueOf(hoy.plusDays(1).atStartOfDay());
        Timestamp tsAhora = Timestamp.valueOf(ahora);

        StringBuilder sb = new StringBuilder();

        // ---------- Fecha y usuario ----------
        sb.append("FECHA Y HORA ACTUAL: ")
                .append(hoy.getDayOfWeek().getDisplayName(TextStyle.FULL, CHILE))
                .append(' ').append(ahora.format(FECHA_HORA)).append(" (hora de Chile)\n");
        sb.append("USUARIO QUE PREGUNTA: ")
                .append(usuario.getNombres()).append(' ').append(usuario.getApellidos())
                .append(" — rol ").append(nombreRol(rol)).append("\n\n");

        // ---------- Sucursales ----------
        sb.append("SUCURSALES ACTIVAS:\n");
        jdbc.query(
                "SELECT nombre, direccion, telefono FROM sucursal WHERE estado = 1 ORDER BY nombre",
                rs -> {
                    sb.append("- ").append(rs.getString("nombre"))
                            .append(": ").append(rs.getString("direccion"));
                    String telefono = rs.getString("telefono");
                    if (telefono != null && !telefono.isBlank()) {
                        sb.append(" (tel. ").append(telefono).append(')');
                    }
                    sb.append('\n');
                });

        // ---------- Motivos de cita ----------
        sb.append("\nTIPOS DE CITA (motivo y duración):\n");
        jdbc.query(
                "SELECT nombre, duracion_minutos FROM motivo_cita WHERE estado = 1 ORDER BY nombre",
                rs -> {
                    sb.append("- ").append(rs.getString("nombre"))
                            .append(" (").append(rs.getInt("duracion_minutos")).append(" min)\n");
                });

        // ---------- Catálogo de tratamientos ----------
        sb.append("\nCATÁLOGO DE TRATAMIENTOS ACTIVOS (valor de referencia; el valor final lo define el presupuesto del odontólogo):\n");
        jdbc.query(
                "SELECT nombre, costo_base FROM tratamiento WHERE estado = 1 ORDER BY nombre LIMIT 80",
                rs -> {
                    sb.append("- ").append(rs.getString("nombre"))
                            .append(": ").append(pesos(rs.getBigDecimal("costo_base"))).append('\n');
                });

        // ---------- Odontólogos y horarios ----------
        Map<Integer, String> odontologos = new LinkedHashMap<>();
        jdbc.query(
                "SELECT u.id_usuario, CONCAT(u.nombres, ' ', u.apellidos) AS nombre, o.especialidad "
                        + "FROM odontologo o JOIN usuario u ON u.id_usuario = o.id_usuario "
                        + "WHERE u.estado = 1 AND o.estado = 1 "
                        + (esOdontologo ? "AND u.id_usuario = ? " : "")
                        + "ORDER BY u.nombres, u.apellidos",
                rs -> {
                    odontologos.put(
                            rs.getInt("id_usuario"),
                            rs.getString("nombre") + " (" + rs.getString("especialidad") + ")");
                },
                esOdontologo ? new Object[]{idUsuario} : new Object[]{});

        Map<Integer, List<String>> horarios = new LinkedHashMap<>();
        jdbc.query(
                "SELECT h.id_usuario, h.dia_semana, h.hora_inicio, h.hora_fin, s.nombre AS sucursal "
                        + "FROM horario_atencion h JOIN sucursal s ON s.id_sucursal = h.id_sucursal "
                        + "WHERE h.estado = 1 ORDER BY h.id_usuario, h.dia_semana, h.hora_inicio",
                rs -> {
                    int dia = rs.getInt("dia_semana");
                    String texto = (dia >= 1 && dia <= 7 ? DIAS[dia] : "Día " + dia) + " "
                            + rs.getTime("hora_inicio").toLocalTime().format(HORA) + "–"
                            + rs.getTime("hora_fin").toLocalTime().format(HORA)
                            + " en " + rs.getString("sucursal");
                    horarios.computeIfAbsent(rs.getInt("id_usuario"), k -> new ArrayList<>()).add(texto);
                });

        sb.append(esOdontologo ? "\nTU HORARIO SEMANAL DE ATENCIÓN:\n" : "\nODONTÓLOGOS ACTIVOS Y HORARIO SEMANAL:\n");
        if (odontologos.isEmpty()) {
            sb.append("- (sin odontólogos activos)\n");
        }
        odontologos.forEach((id, nombre) -> {
            sb.append("- ").append(nombre).append(": ");
            List<String> tramos = horarios.get(id);
            sb.append(tramos == null || tramos.isEmpty()
                    ? "sin horario registrado"
                    : String.join("; ", tramos));
            sb.append('\n');
        });

        // ---------- Bloqueos próximos ----------
        sb.append("\nBLOQUEOS DE AGENDA (próximos 14 días):\n");
        List<String> bloqueos = jdbc.query(
                "SELECT CONCAT(u.nombres, ' ', u.apellidos) AS odontologo, b.fecha_hora_inicio, "
                        + "b.fecha_hora_fin, b.motivo, s.nombre AS sucursal "
                        + "FROM bloqueo_agenda b "
                        + "JOIN usuario u ON u.id_usuario = b.id_usuario "
                        + "JOIN sucursal s ON s.id_sucursal = b.id_sucursal "
                        + "WHERE b.estado = 1 AND b.fecha_hora_fin > ? AND b.fecha_hora_inicio < ? "
                        + (esOdontologo ? "AND b.id_usuario = ? " : "")
                        + "ORDER BY b.fecha_hora_inicio LIMIT 30",
                (rs, fila) -> "- " + rs.getString("odontologo") + ": "
                        + rs.getTimestamp("fecha_hora_inicio").toLocalDateTime().format(FECHA_HORA)
                        + " a "
                        + rs.getTimestamp("fecha_hora_fin").toLocalDateTime().format(FECHA_HORA)
                        + " (" + rs.getString("sucursal") + ")"
                        + (rs.getString("motivo") != null ? " — " + rs.getString("motivo") : ""),
                parametros(esOdontologo, idUsuario,
                        tsAhora, Timestamp.valueOf(ahora.plusDays(14))));
        agregarLista(sb, bloqueos, "sin bloqueos programados");

        // ---------- Citas de hoy (sin datos del paciente) ----------
        String filtroCita = esOdontologo ? " AND c.id_odontologo = ?" : "";

        sb.append(esOdontologo ? "\nTUS CITAS DE HOY" : "\nCITAS DE HOY")
                .append(" (por privacidad no se incluye el nombre del paciente):\n");
        List<String> citasHoy = jdbc.query(
                "SELECT c.fecha_hora, c.fecha_hora_fin, c.estado, "
                        + "CONCAT(u.nombres, ' ', u.apellidos) AS odontologo, "
                        + "s.nombre AS sucursal, m.nombre AS motivo "
                        + "FROM cita c "
                        + "JOIN usuario u ON u.id_usuario = c.id_odontologo "
                        + "JOIN sucursal s ON s.id_sucursal = c.id_sucursal "
                        + "LEFT JOIN motivo_cita m ON m.id_motivo = c.id_motivo "
                        + "WHERE c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita
                        + " ORDER BY c.fecha_hora LIMIT 60",
                (rs, fila) -> "- "
                        + rs.getTimestamp("fecha_hora").toLocalDateTime().format(HORA) + "–"
                        + rs.getTimestamp("fecha_hora_fin").toLocalDateTime().format(HORA) + " | "
                        + (esOdontologo ? "" : rs.getString("odontologo") + " | ")
                        + rs.getString("sucursal") + " | "
                        + (rs.getString("motivo") != null ? rs.getString("motivo") : "Sin motivo") + " | "
                        + rs.getString("estado"),
                parametros(esOdontologo, idUsuario, inicioHoy, finHoy));
        agregarLista(sb, citasHoy, "no hay citas hoy");

        // ---------- Indicadores de agenda ----------
        Timestamp en7Dias = Timestamp.valueOf(hoy.plusDays(8).atStartOfDay());
        Timestamp hace30Dias = Timestamp.valueOf(hoy.minusDays(30).atStartOfDay());

        sb.append("\nINDICADORES DE AGENDA")
                .append(esOdontologo ? " (solo tus citas)" : "").append(":\n");
        sb.append("- Citas RESERVADAS pendientes de confirmar (desde ahora hasta 7 días más): ")
                .append(contar("SELECT COUNT(*) FROM cita c WHERE c.estado = 'RESERVADA' "
                                + "AND c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita,
                        parametros(esOdontologo, idUsuario, tsAhora, en7Dias)))
                .append('\n');
        sb.append("- Citas CONFIRMADAS próximos 7 días: ")
                .append(contar("SELECT COUNT(*) FROM cita c WHERE c.estado = 'CONFIRMADA' "
                                + "AND c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita,
                        parametros(esOdontologo, idUsuario, tsAhora, en7Dias)))
                .append('\n');
        sb.append("- Inasistencias (NO_ASISTIO) últimos 30 días: ")
                .append(contar("SELECT COUNT(*) FROM cita c WHERE c.estado = 'NO_ASISTIO' "
                                + "AND c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita,
                        parametros(esOdontologo, idUsuario, hace30Dias, finHoy)))
                .append('\n');
        sb.append("- Citas canceladas últimos 30 días: ")
                .append(contar("SELECT COUNT(*) FROM cita c WHERE c.estado = 'CANCELADA' "
                                + "AND c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita,
                        parametros(esOdontologo, idUsuario, hace30Dias, finHoy)))
                .append('\n');
        sb.append("- Citas completadas últimos 30 días: ")
                .append(contar("SELECT COUNT(*) FROM cita c WHERE c.estado = 'COMPLETADA' "
                                + "AND c.fecha_hora >= ? AND c.fecha_hora < ?" + filtroCita,
                        parametros(esOdontologo, idUsuario, hace30Dias, finHoy)))
                .append('\n');

        // ---------- Odontólogo: pendientes propios ----------
        if (esOdontologo) {
            sb.append("\nTUS PENDIENTES CLÍNICO-ADMINISTRATIVOS:\n");
            sb.append("- Atenciones en BORRADOR sin cerrar: ")
                    .append(contar("SELECT COUNT(*) FROM atencion WHERE estado = 'BORRADOR' AND id_odontologo = ?",
                            idUsuario))
                    .append('\n');
            agregarConteoPorEstado(sb, "- Tus presupuestos por estado: ",
                    "SELECT estado, COUNT(*) AS total FROM presupuesto WHERE id_odontologo = ? GROUP BY estado",
                    idUsuario);
        }

        // ---------- Recepción y administración: caja y presupuestos ----------
        if (veCaja) {
            sb.append("\nCAJA DE HOY (pagos vigentes):\n");
            List<String> caja = jdbc.query(
                    "SELECT medio_pago, COUNT(*) AS cantidad, COALESCE(SUM(monto), 0) AS total "
                            + "FROM pago WHERE estado = 'PAGADO' AND fecha_hora >= ? AND fecha_hora < ? "
                            + "GROUP BY medio_pago ORDER BY medio_pago",
                    (rs, fila) -> "- " + rs.getString("medio_pago") + ": "
                            + rs.getLong("cantidad") + " pago(s), " + pesos(rs.getBigDecimal("total")),
                    inicioHoy, finHoy);
            agregarLista(sb, caja, "sin pagos registrados hoy");

            sb.append("- Pagos anulados hoy: ")
                    .append(contar("SELECT COUNT(*) FROM pago WHERE estado = 'ANULADO' "
                            + "AND fecha_hora >= ? AND fecha_hora < ?", inicioHoy, finHoy))
                    .append('\n');

            LocalDate inicioMes = hoy.withDayOfMonth(1);
            BigDecimal totalMes = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(monto), 0) FROM pago WHERE estado = 'PAGADO' "
                            + "AND fecha_hora >= ? AND fecha_hora < ?",
                    BigDecimal.class,
                    Timestamp.valueOf(inicioMes.atStartOfDay()), finHoy);
            sb.append("- Total recaudado en el mes (desde el ")
                    .append(inicioMes.format(FECHA)).append("): ")
                    .append(pesos(totalMes)).append('\n');

            sb.append("\nPRESUPUESTOS:\n");
            agregarConteoPorEstado(sb, "- Presupuestos por estado: ",
                    "SELECT estado, COUNT(*) AS total FROM presupuesto GROUP BY estado");

            jdbc.query(
                    "SELECT COUNT(*) AS cantidad, COALESCE(SUM(v.saldo_pendiente), 0) AS saldo "
                            + "FROM presupuesto p JOIN vw_saldo_presupuesto v ON v.id_presupuesto = p.id_presupuesto "
                            + "WHERE p.estado = 'ACEPTADO' AND v.saldo_pendiente > 0",
                    rs -> {
                        sb.append("- Presupuestos aceptados con saldo por cobrar: ")
                                .append(rs.getLong("cantidad")).append(", saldo total ")
                                .append(pesos(rs.getBigDecimal("saldo"))).append('\n');
                    });
        }

        // ---------- Pacientes (solo conteos) ----------
        sb.append("\nPACIENTES (solo totales):\n");
        sb.append("- Pacientes activos: ")
                .append(contar("SELECT COUNT(*) FROM paciente WHERE estado = 1")).append('\n');
        sb.append("- Pacientes con cuenta en el portal: ")
                .append(contar("SELECT COUNT(*) FROM paciente WHERE estado = 1 AND id_usuario IS NOT NULL"))
                .append('\n');

        // ---------- Administración: personal ----------
        if (esAdmin) {
            sb.append("\nPERSONAL:\n");
            agregarConteoPorEstado(sb, "- Usuarios activos por rol: ",
                    "SELECT rol AS estado, COUNT(*) AS total FROM usuario WHERE estado = 1 GROUP BY rol");
            sb.append("- Usuarios inactivos: ")
                    .append(contar("SELECT COUNT(*) FROM usuario WHERE estado = 0")).append('\n');
        }

        return sb.toString();
    }

    /* ---------- Utilidades ---------- */

    private long contar(String sql, Object... parametros) {
        Long total = jdbc.queryForObject(sql, Long.class, parametros);
        return total == null ? 0 : total;
    }

    private void agregarConteoPorEstado(StringBuilder sb, String titulo, String sql, Object... parametros) {
        List<String> partes = jdbc.query(sql,
                (rs, fila) -> rs.getString("estado") + ": " + rs.getLong("total"),
                parametros);
        sb.append(titulo).append(partes.isEmpty() ? "ninguno" : String.join(", ", partes)).append('\n');
    }

    private static void agregarLista(StringBuilder sb, List<String> lineas, String siVacio) {
        if (lineas.isEmpty()) {
            sb.append("- (").append(siVacio).append(")\n");
        } else {
            lineas.forEach(linea -> sb.append(linea).append('\n'));
        }
    }

    /** Agrega el id del odontólogo al final cuando corresponde (filtro "id_odontologo = ?"). */
    private static Object[] parametros(boolean esOdontologo, Integer idUsuario, Object... base) {
        List<Object> lista = new ArrayList<>(List.of(base));
        if (esOdontologo) {
            lista.add(idUsuario);
        }
        return lista.toArray();
    }

    private static String pesos(BigDecimal monto) {
        NumberFormat formato = NumberFormat.getIntegerInstance(CHILE);
        return "$" + formato.format(monto == null ? BigDecimal.ZERO : monto);
    }

    static String nombreRol(Rol rol) {
        if (rol == null) {
            return "sin rol";
        }
        return switch (rol) {
            case ADMIN -> "Administrador";
            case RECEPCIONISTA -> "Recepcionista";
            case ODONTOLOGO -> "Odontólogo";
            case PACIENTE -> "Paciente";
        };
    }
}
