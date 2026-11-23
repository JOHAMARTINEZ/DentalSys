package cl.dentalsys.service;

import cl.dentalsys.dto.AtencionRequest;
import cl.dentalsys.dto.AtencionResponse;
import cl.dentalsys.dto.PresupuestoRequest;
import cl.dentalsys.dto.PresupuestoResponse;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Presupuestos (presupuesto, presupuesto_tratamiento, presupuesto_tratamiento_pieza).
 *
 * Reglas:
 * - Los emite un ODONTOLOGO en una sucursal donde atiende.
 * - PENDIENTE -> ACEPTADO / RECHAZADO (recepción, administración o el paciente).
 * - PENDIENTE con fecha de vencimiento pasada -> VENCIDO (automático).
 * - PENDIENTE o ACEPTADO sin abonos -> ANULADO.
 * - Solo se edita mientras está PENDIENTE (y solo su odontólogo).
 * - El saldo se lee de la vista vw_saldo_presupuesto (no se guarda).
 */
@Service
public class PresupuestoService {

    private static final String SELECT = """
            SELECT p.id_presupuesto, p.fecha_emision, p.fecha_vencimiento, p.estado, p.monto_total,
                   v.total_abonado, v.saldo_pendiente,
                   p.id_paciente, pa.nombres AS pa_nombres, pa.apellidos AS pa_apellidos, pa.rut AS pa_rut,
                   p.id_odontologo, u.nombres AS o_nombres, u.apellidos AS o_apellidos,
                   p.id_sucursal, s.nombre AS s_nombre
            FROM presupuesto p
            JOIN vw_saldo_presupuesto v ON v.id_presupuesto = p.id_presupuesto
            JOIN paciente pa ON pa.id_paciente = p.id_paciente
            JOIN usuario u ON u.id_usuario = p.id_odontologo
            JOIN sucursal s ON s.id_sucursal = p.id_sucursal
            """;

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;
    private final AtencionService atencionService;

    public PresupuestoService(
            JdbcTemplate jdbcTemplate,
            UsuarioRepository usuarioRepository,
            AtencionService atencionService) {
        this.jdbcTemplate = jdbcTemplate;
        this.usuarioRepository = usuarioRepository;
        this.atencionService = atencionService;
    }

    /* =========================================================
       CONSULTAS
    ========================================================= */

    @Transactional
    public List<PresupuestoResponse> listar(Integer idPaciente, String estado) {
        marcarVencidos();

        StringBuilder sql = new StringBuilder(SELECT).append(" WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (idPaciente != null) {
            sql.append(" AND p.id_paciente = ?");
            parametros.add(idPaciente);
        }
        if (estado != null && !estado.isBlank()) {
            sql.append(" AND p.estado = ?");
            parametros.add(estado.trim().toUpperCase());
        }
        sql.append(" ORDER BY p.fecha_emision DESC, p.id_presupuesto DESC LIMIT 500");

        return consultar(sql.toString(), parametros.toArray());
    }

    @Transactional
    public PresupuestoResponse obtener(Integer idPresupuesto) {
        marcarVencidos();
        List<PresupuestoResponse> lista = consultar(SELECT + " WHERE p.id_presupuesto = ?", idPresupuesto);
        if (lista.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El presupuesto no existe.");
        }
        return lista.get(0);
    }

    /** Presupuestos del paciente con sesión (portal). Los anulados no se muestran. */
    @Transactional
    public List<PresupuestoResponse> misPresupuestos(String username) {
        marcarVencidos();
        Integer idPaciente = pacienteDeUsuario(username);
        return consultar(
                SELECT + " WHERE p.id_paciente = ? AND p.estado <> 'ANULADO' "
                        + "ORDER BY p.fecha_emision DESC, p.id_presupuesto DESC",
                idPaciente
        );
    }

    private List<PresupuestoResponse> consultar(String sql, Object... parametros) {

        record Base(Integer id, LocalDate emision, LocalDate vencimiento, String estado,
                    BigDecimal total, BigDecimal abonado, BigDecimal saldo,
                    Integer idPaciente, String paciente, String rut,
                    Integer idOdontologo, String odontologo, Integer idSucursal, String sucursal) {
        }

        List<Base> bases = jdbcTemplate.query(sql, (rs, fila) -> new Base(
                rs.getInt("id_presupuesto"),
                rs.getDate("fecha_emision").toLocalDate(),
                rs.getDate("fecha_vencimiento").toLocalDate(),
                rs.getString("estado"),
                rs.getBigDecimal("monto_total"),
                rs.getBigDecimal("total_abonado"),
                rs.getBigDecimal("saldo_pendiente"),
                rs.getInt("id_paciente"),
                rs.getString("pa_nombres") + " " + rs.getString("pa_apellidos"),
                RutValidator.formatear(rs.getString("pa_rut")),
                rs.getInt("id_odontologo"),
                rs.getString("o_nombres") + " " + rs.getString("o_apellidos"),
                rs.getInt("id_sucursal"),
                rs.getString("s_nombre")
        ), parametros);

        List<PresupuestoResponse> resultado = new ArrayList<>();
        for (Base b : bases) {
            resultado.add(new PresupuestoResponse(
                    b.id(), b.emision(), b.vencimiento(), b.estado(), b.total(), b.abonado(), b.saldo(),
                    b.idPaciente(), b.paciente(), b.rut(), b.idOdontologo(), b.odontologo(),
                    b.idSucursal(), b.sucursal(), tratamientosDe(b.id())
            ));
        }
        return resultado;
    }

    private List<AtencionResponse.TratamientoDetalle> tratamientosDe(Integer idPresupuesto) {

        Map<Integer, List<AtencionRequest.PiezaDental>> piezas = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT id_tratamiento, pieza_dental, superficies, observacion "
                        + "FROM presupuesto_tratamiento_pieza WHERE id_presupuesto = ? ORDER BY pieza_dental",
                rs -> {
                    piezas.computeIfAbsent(rs.getInt("id_tratamiento"), k -> new ArrayList<>())
                            .add(new AtencionRequest.PiezaDental(
                                    rs.getString("pieza_dental"),
                                    rs.getString("superficies"),
                                    rs.getString("observacion")
                            ));
                },
                idPresupuesto
        );

        return jdbcTemplate.query(
                "SELECT pt.id_tratamiento, t.nombre, pt.cantidad, pt.costo_aplicado "
                        + "FROM presupuesto_tratamiento pt "
                        + "JOIN tratamiento t ON t.id_tratamiento = pt.id_tratamiento "
                        + "WHERE pt.id_presupuesto = ? ORDER BY t.nombre",
                (rs, fila) -> {
                    int cantidad = rs.getInt("cantidad");
                    BigDecimal costo = rs.getBigDecimal("costo_aplicado");
                    int idTratamiento = rs.getInt("id_tratamiento");
                    return new AtencionResponse.TratamientoDetalle(
                            idTratamiento,
                            rs.getString("nombre"),
                            cantidad,
                            costo,
                            costo.multiply(BigDecimal.valueOf(cantidad)),
                            piezas.getOrDefault(idTratamiento, List.of())
                    );
                },
                idPresupuesto
        );
    }

    /* =========================================================
       CREAR / EDITAR
    ========================================================= */

    @Transactional
    public PresupuestoResponse crear(PresupuestoRequest request, String username) {

        Usuario odontologo = odontologoActual(username);

        if (request == null || request.idPaciente() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona el paciente.");
        }
        if (request.idSucursal() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona la sucursal.");
        }

        List<Integer> estadoPaciente = jdbcTemplate.queryForList(
                "SELECT estado FROM paciente WHERE id_paciente = ?", Integer.class, request.idPaciente());
        if (estadoPaciente.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El paciente no existe.");
        }
        if (estadoPaciente.get(0) != 1) {
            throw error(HttpStatus.BAD_REQUEST, "El paciente está desactivado.");
        }

        Integer atiende = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM odontologo_sucursal WHERE id_usuario = ? AND id_sucursal = ?",
                Integer.class, odontologo.getIdUsuario(), request.idSucursal());
        if (atiende == null || atiende == 0) {
            throw error(HttpStatus.BAD_REQUEST, "No atiendes en la sucursal seleccionada.");
        }

        LocalDate vencimiento = validarVencimiento(request.fechaVencimiento());
        List<AtencionRequest.TratamientoAplicado> tratamientos = validarItems(request.tratamientos());
        BigDecimal total = calcularTotal(tratamientos);

        Integer idPaciente = request.idPaciente();
        Integer idSucursal = request.idSucursal();
        Integer idOdontologo = odontologo.getIdUsuario();

        KeyHolder llave = new GeneratedKeyHolder();
        jdbcTemplate.update(conexion -> {
            PreparedStatement ps = conexion.prepareStatement(
                    "INSERT INTO presupuesto (fecha_emision, fecha_vencimiento, estado, monto_total, "
                            + "id_paciente, id_odontologo, id_sucursal) VALUES (?, ?, 'PENDIENTE', ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setDate(1, Date.valueOf(LocalDate.now()));
            ps.setDate(2, Date.valueOf(vencimiento));
            ps.setBigDecimal(3, total);
            ps.setInt(4, idPaciente);
            ps.setInt(5, idOdontologo);
            ps.setInt(6, idSucursal);
            return ps;
        }, llave);

        Number id = llave.getKey();
        int idPresupuesto = id == null ? 0 : id.intValue();
        guardarItems(idPresupuesto, tratamientos);

        return obtener(idPresupuesto);
    }

    @Transactional
    public PresupuestoResponse actualizar(Integer idPresupuesto, PresupuestoRequest request, String username) {

        Usuario odontologo = odontologoActual(username);
        PresupuestoResponse actual = obtener(idPresupuesto);

        if (!actual.idOdontologo().equals(odontologo.getIdUsuario())) {
            throw error(HttpStatus.FORBIDDEN, "Solo el odontólogo que lo emitió puede modificarlo.");
        }
        if (!"PENDIENTE".equals(actual.estado())) {
            throw error(HttpStatus.BAD_REQUEST, "Solo se pueden modificar presupuestos pendientes.");
        }
        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del presupuesto.");
        }

        LocalDate vencimiento = validarVencimiento(request.fechaVencimiento());
        List<AtencionRequest.TratamientoAplicado> tratamientos = validarItems(request.tratamientos());

        jdbcTemplate.update(
                "UPDATE presupuesto SET fecha_vencimiento = ?, monto_total = ? WHERE id_presupuesto = ?",
                Date.valueOf(vencimiento), calcularTotal(tratamientos), idPresupuesto
        );

        jdbcTemplate.update("DELETE FROM presupuesto_tratamiento_pieza WHERE id_presupuesto = ?", idPresupuesto);
        jdbcTemplate.update("DELETE FROM presupuesto_tratamiento WHERE id_presupuesto = ?", idPresupuesto);
        guardarItems(idPresupuesto, tratamientos);

        return obtener(idPresupuesto);
    }

    /* =========================================================
       ESTADOS
    ========================================================= */

    /** Cambio de estado desde la gestión (recepción, administración u odontólogo). */
    @Transactional
    public PresupuestoResponse cambiarEstado(Integer idPresupuesto, String estado, String username) {

        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));

        PresupuestoResponse actual = obtener(idPresupuesto);
        String nuevo = estado == null ? "" : estado.trim().toUpperCase();

        switch (nuevo) {
            case "ACEPTADO", "RECHAZADO" -> {
                if (usuario.getRol() == Rol.ODONTOLOGO) {
                    throw error(HttpStatus.FORBIDDEN,
                            "La respuesta del paciente la registra recepción o el propio paciente.");
                }
                responderPendiente(actual, nuevo);
            }
            case "ANULADO" -> {
                if (usuario.getRol() == Rol.ODONTOLOGO
                        && !actual.idOdontologo().equals(usuario.getIdUsuario())) {
                    throw error(HttpStatus.FORBIDDEN, "Solo puedes anular tus propios presupuestos.");
                }
                if (!"PENDIENTE".equals(actual.estado()) && !"ACEPTADO".equals(actual.estado())) {
                    throw error(HttpStatus.BAD_REQUEST,
                            "Solo se anulan presupuestos pendientes o aceptados.");
                }
                Integer pagos = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM pago WHERE id_presupuesto = ? AND estado = 'PAGADO'",
                        Integer.class, idPresupuesto);
                if (pagos != null && pagos > 0) {
                    throw error(HttpStatus.CONFLICT,
                            "El presupuesto tiene abonos vigentes. Anula primero esos pagos.");
                }
                jdbcTemplate.update(
                        "UPDATE presupuesto SET estado = 'ANULADO' WHERE id_presupuesto = ?", idPresupuesto);
            }
            default -> throw error(HttpStatus.BAD_REQUEST, "El estado indicado no es válido.");
        }

        return obtener(idPresupuesto);
    }

    /** El paciente acepta o rechaza su presupuesto desde el portal. */
    @Transactional
    public PresupuestoResponse responderComoPaciente(Integer idPresupuesto, String estado, String username) {

        Integer idPaciente = pacienteDeUsuario(username);
        PresupuestoResponse actual = obtener(idPresupuesto);

        if (!actual.idPaciente().equals(idPaciente)) {
            throw error(HttpStatus.FORBIDDEN, "Este presupuesto no te pertenece.");
        }

        String nuevo = estado == null ? "" : estado.trim().toUpperCase();
        if (!"ACEPTADO".equals(nuevo) && !"RECHAZADO".equals(nuevo)) {
            throw error(HttpStatus.BAD_REQUEST, "Indica si aceptas o rechazas el presupuesto.");
        }

        responderPendiente(actual, nuevo);
        return obtener(idPresupuesto);
    }

    private void responderPendiente(PresupuestoResponse actual, String nuevo) {
        if (!"PENDIENTE".equals(actual.estado())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Solo se puede aceptar o rechazar un presupuesto pendiente (este está "
                            + actual.estado().toLowerCase() + ").");
        }
        jdbcTemplate.update(
                "UPDATE presupuesto SET estado = ? WHERE id_presupuesto = ?", nuevo, actual.idPresupuesto());
    }

    /* =========================================================
       AUXILIARES
    ========================================================= */

    /** PENDIENTE con fecha de vencimiento pasada pasa a VENCIDO. */
    private void marcarVencidos() {
        jdbcTemplate.update(
                "UPDATE presupuesto SET estado = 'VENCIDO' "
                        + "WHERE estado = 'PENDIENTE' AND fecha_vencimiento < ?",
                Date.valueOf(LocalDate.now())
        );
    }

    private LocalDate validarVencimiento(LocalDate fecha) {
        if (fecha == null) {
            throw error(HttpStatus.BAD_REQUEST, "Indica la fecha de vencimiento.");
        }
        if (fecha.isBefore(LocalDate.now())) {
            throw error(HttpStatus.BAD_REQUEST, "La fecha de vencimiento no puede ser anterior a hoy.");
        }
        if (fecha.isAfter(LocalDate.now().plusYears(2))) {
            throw error(HttpStatus.BAD_REQUEST, "Revisa la fecha de vencimiento.");
        }
        return fecha;
    }

    private List<AtencionRequest.TratamientoAplicado> validarItems(
            List<AtencionRequest.TratamientoAplicado> tratamientos) {
        List<AtencionRequest.TratamientoAplicado> lista = atencionService.validarTratamientos(tratamientos);
        if (lista.isEmpty()) {
            throw error(HttpStatus.BAD_REQUEST, "Agrega al menos un tratamiento al presupuesto.");
        }
        return lista;
    }

    private static BigDecimal calcularTotal(List<AtencionRequest.TratamientoAplicado> tratamientos) {
        BigDecimal total = tratamientos.stream()
                .map(t -> t.costoAplicado().setScale(2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(t.cantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total.compareTo(new BigDecimal("99999999.99")) > 0) {
            throw error(HttpStatus.BAD_REQUEST, "El monto total supera el máximo permitido.");
        }
        return total;
    }

    private void guardarItems(int idPresupuesto, List<AtencionRequest.TratamientoAplicado> tratamientos) {
        for (AtencionRequest.TratamientoAplicado t : tratamientos) {
            jdbcTemplate.update(
                    "INSERT INTO presupuesto_tratamiento (id_presupuesto, id_tratamiento, cantidad, costo_aplicado) "
                            + "VALUES (?, ?, ?, ?)",
                    idPresupuesto, t.idTratamiento(), t.cantidad(),
                    t.costoAplicado().setScale(2, RoundingMode.HALF_UP)
            );
            if (t.piezas() == null) {
                continue;
            }
            for (AtencionRequest.PiezaDental p : t.piezas()) {
                jdbcTemplate.update(
                        "INSERT INTO presupuesto_tratamiento_pieza "
                                + "(id_presupuesto, id_tratamiento, pieza_dental, superficies, observacion) "
                                + "VALUES (?, ?, ?, ?, ?)",
                        idPresupuesto, t.idTratamiento(), p.pieza().trim(),
                        p.superficies() == null || p.superficies().isBlank() ? null : p.superficies().trim().toUpperCase(),
                        p.observacion() == null || p.observacion().isBlank() ? null : p.observacion().trim()
                );
            }
        }
    }

    private Usuario odontologoActual(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
        if (usuario.getRol() != Rol.ODONTOLOGO) {
            throw error(HttpStatus.FORBIDDEN, "Solo un odontólogo puede emitir presupuestos.");
        }
        return usuario;
    }

    private Integer pacienteDeUsuario(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
        List<Integer> ids = jdbcTemplate.queryForList(
                "SELECT id_paciente FROM paciente WHERE id_usuario = ?", Integer.class, usuario.getIdUsuario());
        if (ids.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "Tu cuenta no está asociada a un paciente.");
        }
        return ids.get(0);
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
