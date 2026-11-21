package cl.dentalsys.service;

import cl.dentalsys.dto.PagoRequest;
import cl.dentalsys.dto.PagoResponse;
import cl.dentalsys.dto.PendientePagoResponse;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pagos y comprobantes (pago, comprobante_pago).
 *
 * Reglas (notas del script v2):
 * - Cada pago va a un presupuesto ACEPTADO o a una atención CERRADA (no a ambos).
 * - El abono no puede superar el saldo. Para evitar abonos simultáneos se
 *   bloquea la fila del presupuesto o de la atención (SELECT ... FOR UPDATE).
 * - Cada pago genera su comprobante con folio único en la misma transacción.
 * - Un pago no se borra: se ANULA con responsable, fecha y motivo, y su
 *   comprobante se anula en la misma transacción.
 * - Pago de demostración (portal): simulado y marcado como tal; no hay cobro real.
 */
@Service
public class PagoService {

    private static final Set<String> MEDIOS = Set.of("EFECTIVO", "TARJETA", "TRANSFERENCIA");
    private static final BigDecimal MAXIMO = new BigDecimal("99999999.99");
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final String OBSERVACION_DEMO =
            "Pago de demostración desde el portal del paciente (sin cobro real)";

    private static final String SELECT = """
            SELECT pg.id_pago, pg.fecha_hora, pg.monto, pg.medio_pago, pg.estado,
                   pg.id_paciente, pa.nombres AS pa_nombres, pa.apellidos AS pa_apellidos, pa.rut AS pa_rut,
                   pg.id_presupuesto, pg.id_atencion, ate.fecha_hora AS fecha_atencion,
                   pg.observacion, pg.fecha_anulacion, pg.motivo_anulacion,
                   ur.nombres AS r_nombres, ur.apellidos AS r_apellidos, ur.rol AS r_rol,
                   ua.nombres AS a_nombres, ua.apellidos AS a_apellidos,
                   cp.folio, cp.estado AS estado_comprobante,
                   s.nombre AS s_nombre, s.direccion AS s_direccion
            FROM pago pg
            JOIN paciente pa ON pa.id_paciente = pg.id_paciente
            LEFT JOIN presupuesto pr ON pr.id_presupuesto = pg.id_presupuesto
            LEFT JOIN atencion ate ON ate.id_atencion = pg.id_atencion
            LEFT JOIN sucursal s ON s.id_sucursal = COALESCE(pr.id_sucursal, ate.id_sucursal)
            LEFT JOIN usuario ur ON ur.id_usuario = pg.id_usuario_registra
            LEFT JOIN usuario ua ON ua.id_usuario = pg.id_usuario_anula
            LEFT JOIN comprobante_pago cp ON cp.id_pago = pg.id_pago
            """;

    private static final RowMapper<PagoResponse> MAPEO = (rs, fila) -> {
        int idPresupuesto = rs.getInt("id_presupuesto");
        Integer presupuesto = rs.wasNull() ? null : idPresupuesto;
        int idAtencion = rs.getInt("id_atencion");
        Integer atencion = rs.wasNull() ? null : idAtencion;
        Timestamp fechaAtencion = rs.getTimestamp("fecha_atencion");
        Timestamp anulacion = rs.getTimestamp("fecha_anulacion");

        String concepto = presupuesto != null
                ? "Presupuesto N° " + presupuesto
                : "Atención del " + (fechaAtencion == null ? "" : fechaAtencion.toLocalDateTime().format(FORMATO_FECHA));

        String registrador = rs.getString("r_nombres");
        String registradoPor = registrador == null
                ? null
                : "PACIENTE".equals(rs.getString("r_rol"))
                    ? "Paciente (portal)"
                    : registrador + " " + rs.getString("r_apellidos");
        String anulador = rs.getString("a_nombres");

        return new PagoResponse(
                rs.getInt("id_pago"),
                rs.getTimestamp("fecha_hora").toLocalDateTime(),
                rs.getBigDecimal("monto"),
                rs.getString("medio_pago"),
                rs.getString("estado"),
                rs.getInt("id_paciente"),
                rs.getString("pa_nombres") + " " + rs.getString("pa_apellidos"),
                RutValidator.formatear(rs.getString("pa_rut")),
                presupuesto,
                atencion,
                concepto,
                rs.getString("observacion"),
                registradoPor,
                anulacion == null ? null : anulacion.toLocalDateTime(),
                anulador == null ? null : anulador + " " + rs.getString("a_apellidos"),
                rs.getString("motivo_anulacion"),
                rs.getString("folio"),
                rs.getString("estado_comprobante"),
                rs.getString("s_nombre"),
                rs.getString("s_direccion")
        );
    };

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;

    public PagoService(JdbcTemplate jdbcTemplate, UsuarioRepository usuarioRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.usuarioRepository = usuarioRepository;
    }

    /* =========================================================
       CONSULTAS
    ========================================================= */

    @Transactional(readOnly = true)
    public List<PagoResponse> listar(LocalDate desde, LocalDate hasta, Integer idPaciente,
                                     Integer idPresupuesto, String estado) {

        StringBuilder sql = new StringBuilder(SELECT).append(" WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (desde != null) {
            sql.append(" AND pg.fecha_hora >= ?");
            parametros.add(Timestamp.valueOf(desde.atStartOfDay()));
        }
        if (hasta != null) {
            sql.append(" AND pg.fecha_hora < ?");
            parametros.add(Timestamp.valueOf(hasta.plusDays(1).atStartOfDay()));
        }
        if (idPaciente != null) {
            sql.append(" AND pg.id_paciente = ?");
            parametros.add(idPaciente);
        }
        if (idPresupuesto != null) {
            sql.append(" AND pg.id_presupuesto = ?");
            parametros.add(idPresupuesto);
        }
        if (estado != null && !estado.isBlank()) {
            sql.append(" AND pg.estado = ?");
            parametros.add(estado.trim().toUpperCase());
        }
        sql.append(" ORDER BY pg.fecha_hora DESC, pg.id_pago DESC LIMIT 1000");

        return jdbcTemplate.query(sql.toString(), MAPEO, parametros.toArray());
    }

    @Transactional(readOnly = true)
    public PagoResponse obtener(Integer idPago) {
        List<PagoResponse> lista = jdbcTemplate.query(SELECT + " WHERE pg.id_pago = ?", MAPEO, idPago);
        if (lista.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El pago no existe.");
        }
        return lista.get(0);
    }

    @Transactional(readOnly = true)
    public List<PagoResponse> misPagos(String username) {
        Integer idPaciente = pacienteDeUsuario(username).idPaciente();
        return jdbcTemplate.query(
                SELECT + " WHERE pg.id_paciente = ? ORDER BY pg.fecha_hora DESC", MAPEO, idPaciente);
    }

    /** Presupuestos aceptados y atenciones cerradas con saldo, de un paciente. */
    @Transactional(readOnly = true)
    public List<PendientePagoResponse> pendientes(Integer idPaciente) {

        List<PendientePagoResponse> lista = new ArrayList<>(jdbcTemplate.query(
                """
                SELECT p.id_presupuesto, p.fecha_emision, v.monto_total, v.total_abonado, v.saldo_pendiente
                FROM presupuesto p
                JOIN vw_saldo_presupuesto v ON v.id_presupuesto = p.id_presupuesto
                WHERE p.id_paciente = ? AND p.estado = 'ACEPTADO' AND v.saldo_pendiente > 0
                ORDER BY p.fecha_emision
                """,
                (rs, fila) -> new PendientePagoResponse(
                        "PRESUPUESTO",
                        rs.getInt("id_presupuesto"),
                        "Presupuesto N° " + rs.getInt("id_presupuesto"),
                        rs.getDate("fecha_emision").toLocalDate().atStartOfDay(),
                        rs.getBigDecimal("monto_total"),
                        rs.getBigDecimal("total_abonado"),
                        rs.getBigDecimal("saldo_pendiente")
                ),
                idPaciente
        ));

        lista.addAll(jdbcTemplate.query(
                """
                SELECT x.id_atencion, x.fecha_hora, x.total, x.pagado
                FROM (
                    SELECT a.id_atencion, a.fecha_hora,
                           COALESCE((SELECT SUM(t.cantidad * t.costo_aplicado)
                                     FROM atencion_tratamiento t WHERE t.id_atencion = a.id_atencion), 0) AS total,
                           COALESCE((SELECT SUM(pg.monto) FROM pago pg
                                     WHERE pg.id_atencion = a.id_atencion AND pg.estado = 'PAGADO'), 0) AS pagado
                    FROM atencion a
                    JOIN ficha_clinica f ON f.id_ficha = a.id_ficha
                    WHERE f.id_paciente = ? AND a.estado = 'CERRADA'
                ) x
                WHERE x.total - x.pagado > 0
                ORDER BY x.fecha_hora
                """,
                (rs, fila) -> {
                    BigDecimal total = rs.getBigDecimal("total");
                    BigDecimal pagado = rs.getBigDecimal("pagado");
                    LocalDateTime fecha = rs.getTimestamp("fecha_hora").toLocalDateTime();
                    return new PendientePagoResponse(
                            "ATENCION",
                            rs.getInt("id_atencion"),
                            "Atención del " + fecha.format(FORMATO_FECHA),
                            fecha,
                            total,
                            pagado,
                            total.subtract(pagado)
                    );
                },
                idPaciente
        ));

        return lista;
    }

    /* =========================================================
       REGISTRAR
    ========================================================= */

    /** Pago registrado por recepción o administración. */
    @Transactional
    public PagoResponse registrar(PagoRequest request, String username) {
        Usuario usuario = usuarioActual(username);
        if (usuario.getRol() != Rol.ADMIN && usuario.getRol() != Rol.RECEPCIONISTA) {
            throw error(HttpStatus.FORBIDDEN, "Los pagos los registra recepción.");
        }
        return registrarPago(request, usuario.getIdUsuario(), null, false);
    }

    /** Pago de demostración hecho por el paciente desde su portal (sin cobro real). */
    @Transactional
    public PagoResponse pagarDemo(PagoRequest request, String username) {
        Paciente paciente = pacienteDeUsuario(username);
        PagoRequest demo = new PagoRequest(
                request == null ? null : request.idPresupuesto(),
                request == null ? null : request.idAtencion(),
                request == null ? null : request.monto(),
                "TARJETA",
                OBSERVACION_DEMO
        );
        return registrarPago(demo, paciente.idUsuario(), paciente.idPaciente(), true);
    }

    private PagoResponse registrarPago(
            PagoRequest request,
            Integer idUsuarioRegistra,
            Integer soloPaciente,
            boolean demo) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del pago.");
        }

        boolean aPresupuesto = request.idPresupuesto() != null;
        boolean aAtencion = request.idAtencion() != null;
        if (aPresupuesto == aAtencion) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El pago debe asociarse a un presupuesto o a una atención (solo uno).");
        }

        String medio = request.medioPago() == null ? "" : request.medioPago().trim().toUpperCase();
        if (!MEDIOS.contains(medio)) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona el medio de pago.");
        }

        if (request.monto() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Ingresa el monto.");
        }
        BigDecimal monto = request.monto().setScale(2, RoundingMode.HALF_UP);
        if (monto.signum() <= 0 || monto.compareTo(MAXIMO) > 0) {
            throw error(HttpStatus.BAD_REQUEST, "El monto debe ser mayor que cero.");
        }

        String observacion = request.observacion() == null || request.observacion().isBlank()
                ? null : request.observacion().trim();
        if (observacion != null && observacion.length() > 250) {
            throw error(HttpStatus.BAD_REQUEST, "La observación no puede superar 250 caracteres.");
        }

        int idPaciente;
        BigDecimal saldo;

        if (aPresupuesto) {
            List<Map<String, Object>> filas = jdbcTemplate.queryForList(
                    "SELECT id_paciente, estado FROM presupuesto WHERE id_presupuesto = ? FOR UPDATE",
                    request.idPresupuesto());
            if (filas.isEmpty()) {
                throw error(HttpStatus.NOT_FOUND, "El presupuesto no existe.");
            }
            idPaciente = ((Number) filas.get(0).get("id_paciente")).intValue();
            if (!"ACEPTADO".equals(filas.get(0).get("estado"))) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Solo se registran abonos a presupuestos aceptados.");
            }
            saldo = jdbcTemplate.queryForObject(
                    "SELECT saldo_pendiente FROM vw_saldo_presupuesto WHERE id_presupuesto = ?",
                    BigDecimal.class, request.idPresupuesto());
        } else {
            List<Map<String, Object>> filas = jdbcTemplate.queryForList(
                    "SELECT f.id_paciente, a.estado FROM atencion a "
                            + "JOIN ficha_clinica f ON f.id_ficha = a.id_ficha "
                            + "WHERE a.id_atencion = ? FOR UPDATE",
                    request.idAtencion());
            if (filas.isEmpty()) {
                throw error(HttpStatus.NOT_FOUND, "La atención no existe.");
            }
            idPaciente = ((Number) filas.get(0).get("id_paciente")).intValue();
            if (!"CERRADA".equals(filas.get(0).get("estado"))) {
                throw error(HttpStatus.BAD_REQUEST, "Solo se pagan atenciones cerradas.");
            }
            saldo = jdbcTemplate.queryForObject(
                    "SELECT COALESCE((SELECT SUM(cantidad * costo_aplicado) FROM atencion_tratamiento "
                            + "WHERE id_atencion = ?), 0) - COALESCE((SELECT SUM(monto) FROM pago "
                            + "WHERE id_atencion = ? AND estado = 'PAGADO'), 0)",
                    BigDecimal.class, request.idAtencion(), request.idAtencion());
        }

        if (soloPaciente != null && soloPaciente != idPaciente) {
            throw error(HttpStatus.FORBIDDEN, "Este cobro no te pertenece.");
        }

        if (saldo == null || saldo.signum() <= 0) {
            throw error(HttpStatus.BAD_REQUEST, "No hay saldo pendiente.");
        }
        if (monto.compareTo(saldo) > 0) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El monto supera el saldo pendiente ($" + saldo.setScale(0, RoundingMode.HALF_UP).toPlainString() + ").");
        }

        int paciente = idPaciente;
        String obs = demo ? OBSERVACION_DEMO : observacion;
        KeyHolder llave = new GeneratedKeyHolder();
        jdbcTemplate.update(conexion -> {
            PreparedStatement ps = conexion.prepareStatement(
                    "INSERT INTO pago (monto, medio_pago, estado, id_paciente, id_atencion, id_presupuesto, "
                            + "id_usuario_registra, observacion) VALUES (?, ?, 'PAGADO', ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setBigDecimal(1, monto);
            ps.setString(2, medio);
            ps.setInt(3, paciente);
            if (request.idAtencion() == null) {
                ps.setNull(4, java.sql.Types.INTEGER);
            } else {
                ps.setInt(4, request.idAtencion());
            }
            if (request.idPresupuesto() == null) {
                ps.setNull(5, java.sql.Types.INTEGER);
            } else {
                ps.setInt(5, request.idPresupuesto());
            }
            ps.setInt(6, idUsuarioRegistra);
            ps.setString(7, obs);
            return ps;
        }, llave);

        Number id = llave.getKey();
        int idPago = id == null ? 0 : id.intValue();

        // Comprobante en la misma transacción (folio único por pago)
        String folio = "MD-" + LocalDate.now().getYear() + "-" + String.format("%06d", idPago);
        jdbcTemplate.update(
                "INSERT INTO comprobante_pago (id_pago, folio, estado) VALUES (?, ?, 'GENERADO')",
                idPago, folio
        );

        return obtener(idPago);
    }

    /* =========================================================
       ANULAR
    ========================================================= */

    @Transactional
    public PagoResponse anular(Integer idPago, String motivo, String username) {

        Usuario usuario = usuarioActual(username);
        if (usuario.getRol() != Rol.ADMIN && usuario.getRol() != Rol.RECEPCIONISTA) {
            throw error(HttpStatus.FORBIDDEN, "Los pagos los anula recepción o administración.");
        }

        if (motivo == null || motivo.isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, "Indica el motivo de la anulación.");
        }
        String texto = motivo.trim();
        if (texto.length() > 250) {
            throw error(HttpStatus.BAD_REQUEST, "El motivo no puede superar 250 caracteres.");
        }

        List<String> estado = jdbcTemplate.queryForList(
                "SELECT estado FROM pago WHERE id_pago = ? FOR UPDATE", String.class, idPago);
        if (estado.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El pago no existe.");
        }
        if (!"PAGADO".equals(estado.get(0))) {
            throw error(HttpStatus.BAD_REQUEST, "El pago ya está anulado.");
        }

        jdbcTemplate.update(
                "UPDATE pago SET estado = 'ANULADO', fecha_anulacion = ?, id_usuario_anula = ?, "
                        + "motivo_anulacion = ? WHERE id_pago = ?",
                Timestamp.valueOf(LocalDateTime.now().withNano(0)), usuario.getIdUsuario(), texto, idPago
        );
        jdbcTemplate.update(
                "UPDATE comprobante_pago SET estado = 'ANULADO' WHERE id_pago = ?", idPago);

        return obtener(idPago);
    }

    /* =========================================================
       AUXILIARES
    ========================================================= */

    private record Paciente(Integer idPaciente, Integer idUsuario) {
    }

    private Paciente pacienteDeUsuario(String username) {
        Usuario usuario = usuarioActual(username);
        List<Integer> ids = jdbcTemplate.queryForList(
                "SELECT id_paciente FROM paciente WHERE id_usuario = ?", Integer.class, usuario.getIdUsuario());
        if (ids.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "Tu cuenta no está asociada a un paciente.");
        }
        return new Paciente(ids.get(0), usuario.getIdUsuario());
    }

    private Usuario usuarioActual(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
