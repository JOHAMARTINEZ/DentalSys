package cl.dentalsys.service;

import cl.dentalsys.dto.AtencionRequest;
import cl.dentalsys.dto.AtencionResponse;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Atenciones clínicas (atencion, atencion_tratamiento, atencion_tratamiento_pieza).
 *
 * Reglas (notas del script v2):
 * - Una atención nace en BORRADOR y solo su odontólogo la edita.
 * - Al cerrarla (CERRADA) ya no se puede modificar ni eliminar.
 * - Si viene de una cita, el paciente de la cita debe ser el de la atención,
 *   la cita debe ser del mismo odontólogo y no puede tener otra atención.
 *   Al cerrar, la cita pasa a COMPLETADA (queda en historial_cita).
 * - La sucursal debe ser una donde atiende el odontólogo.
 * - Las piezas dentales son opcionales (código FDI 11-48 / 51-85).
 */
@Service
public class AtencionService {

    private static final String REGEX_PIEZA = "^[1-4][1-8]$|^[5-8][1-5]$";
    private static final String REGEX_SUPERFICIES = "^[OMDVPL](,[OMDVPL])*$";
    private static final int LARGO_TEXTO = 5000;

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;
    private final FichaClinicaService fichaClinicaService;

    public AtencionService(
            JdbcTemplate jdbcTemplate,
            UsuarioRepository usuarioRepository,
            FichaClinicaService fichaClinicaService) {
        this.jdbcTemplate = jdbcTemplate;
        this.usuarioRepository = usuarioRepository;
        this.fichaClinicaService = fichaClinicaService;
    }

    /* =========================================================
       CONSULTAS
    ========================================================= */

    private static final String SELECT = """
            SELECT a.id_atencion, a.fecha_hora, a.estado, a.diagnostico, a.observaciones,
                   a.indicaciones, a.id_cita, c.fecha_hora AS fecha_cita,
                   f.id_paciente, p.nombres AS p_nombres, p.apellidos AS p_apellidos,
                   a.id_odontologo, u.nombres AS o_nombres, u.apellidos AS o_apellidos,
                   a.id_sucursal, s.nombre AS s_nombre
            FROM atencion a
            JOIN ficha_clinica f ON f.id_ficha = a.id_ficha
            JOIN paciente p ON p.id_paciente = f.id_paciente
            JOIN usuario u ON u.id_usuario = a.id_odontologo
            JOIN sucursal s ON s.id_sucursal = a.id_sucursal
            LEFT JOIN cita c ON c.id_cita = a.id_cita
            """;

    /** Atenciones de un paciente, de la más reciente a la más antigua. */
    @Transactional(readOnly = true)
    public List<AtencionResponse> listarPorPaciente(Integer idPaciente) {
        return consultar(SELECT + " WHERE f.id_paciente = ? ORDER BY a.fecha_hora DESC", idPaciente);
    }

    @Transactional(readOnly = true)
    public AtencionResponse obtener(Integer idAtencion) {
        List<AtencionResponse> lista = consultar(SELECT + " WHERE a.id_atencion = ?", idAtencion);
        if (lista.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "La atención no existe.");
        }
        return lista.get(0);
    }

    private List<AtencionResponse> consultar(String sql, Object... parametros) {

        record Base(Integer id, LocalDateTime fecha, String estado, String diagnostico,
                    String observaciones, String indicaciones, Integer idCita, LocalDateTime fechaCita,
                    Integer idPaciente, String paciente, Integer idOdontologo, String odontologo,
                    Integer idSucursal, String sucursal) {
        }

        List<Base> bases = jdbcTemplate.query(sql, (rs, fila) -> {
            int idCita = rs.getInt("id_cita");
            boolean sinCita = rs.wasNull();
            Timestamp fechaCita = rs.getTimestamp("fecha_cita");
            return new Base(
                    rs.getInt("id_atencion"),
                    rs.getTimestamp("fecha_hora").toLocalDateTime(),
                    rs.getString("estado"),
                    rs.getString("diagnostico"),
                    rs.getString("observaciones"),
                    rs.getString("indicaciones"),
                    sinCita ? null : idCita,
                    fechaCita == null ? null : fechaCita.toLocalDateTime(),
                    rs.getInt("id_paciente"),
                    rs.getString("p_nombres") + " " + rs.getString("p_apellidos"),
                    rs.getInt("id_odontologo"),
                    rs.getString("o_nombres") + " " + rs.getString("o_apellidos"),
                    rs.getInt("id_sucursal"),
                    rs.getString("s_nombre")
            );
        }, parametros);

        List<AtencionResponse> resultado = new ArrayList<>();

        for (Base b : bases) {
            List<AtencionResponse.TratamientoDetalle> tratamientos = tratamientosDe(b.id());
            BigDecimal total = tratamientos.stream()
                    .map(AtencionResponse.TratamientoDetalle::subtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            resultado.add(new AtencionResponse(
                    b.id(), b.fecha(), b.estado(), b.diagnostico(), b.observaciones(),
                    b.indicaciones(), b.idCita(), b.fechaCita(), b.idPaciente(), b.paciente(),
                    b.idOdontologo(), b.odontologo(), b.idSucursal(), b.sucursal(),
                    total, tratamientos
            ));
        }

        return resultado;
    }

    private List<AtencionResponse.TratamientoDetalle> tratamientosDe(Integer idAtencion) {

        Map<Integer, List<AtencionRequest.PiezaDental>> piezas = new LinkedHashMap<>();
        jdbcTemplate.query(
                "SELECT id_tratamiento, pieza_dental, superficies, observacion "
                        + "FROM atencion_tratamiento_pieza WHERE id_atencion = ? ORDER BY pieza_dental",
                rs -> {
                    piezas.computeIfAbsent(rs.getInt("id_tratamiento"), k -> new ArrayList<>())
                            .add(new AtencionRequest.PiezaDental(
                                    rs.getString("pieza_dental"),
                                    rs.getString("superficies"),
                                    rs.getString("observacion")
                            ));
                },
                idAtencion
        );

        return jdbcTemplate.query(
                "SELECT atr.id_tratamiento, t.nombre, atr.cantidad, atr.costo_aplicado "
                        + "FROM atencion_tratamiento atr "
                        + "JOIN tratamiento t ON t.id_tratamiento = atr.id_tratamiento "
                        + "WHERE atr.id_atencion = ? ORDER BY t.nombre",
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
                idAtencion
        );
    }

    /* =========================================================
       CREAR / EDITAR (solo BORRADOR)
    ========================================================= */

    @Transactional
    public AtencionResponse crear(AtencionRequest request, String username) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos de la atención.");
        }

        Usuario odontologo = odontologoActual(username);
        Integer idPaciente;
        Integer idSucursal;

        if (request.idCita() != null) {
            Map<String, Object> cita = buscarCita(request.idCita());

            idPaciente = ((Number) cita.get("id_paciente")).intValue();
            idSucursal = ((Number) cita.get("id_sucursal")).intValue();
            int idOdontologoCita = ((Number) cita.get("id_odontologo")).intValue();

            if (request.idPaciente() != null && !request.idPaciente().equals(idPaciente)) {
                throw error(HttpStatus.BAD_REQUEST,
                        "La cita seleccionada pertenece a otro paciente.");
            }
            if (idOdontologoCita != odontologo.getIdUsuario()) {
                throw error(HttpStatus.FORBIDDEN, "La cita seleccionada es de otro odontólogo.");
            }
            if ("CANCELADA".equals(cita.get("estado")) || "NO_ASISTIO".equals(cita.get("estado"))) {
                throw error(HttpStatus.BAD_REQUEST,
                        "No se puede registrar una atención para una cita cancelada o sin asistencia.");
            }

            Integer existentes = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM atencion WHERE id_cita = ?", Integer.class, request.idCita());
            if (existentes != null && existentes > 0) {
                throw error(HttpStatus.CONFLICT, "Esa cita ya tiene una atención registrada.");
            }
        } else {
            if (request.idPaciente() == null) {
                throw error(HttpStatus.BAD_REQUEST, "Selecciona el paciente.");
            }
            if (request.idSucursal() == null) {
                throw error(HttpStatus.BAD_REQUEST, "Selecciona la sucursal donde se atendió.");
            }
            idPaciente = request.idPaciente();
            idSucursal = request.idSucursal();

            Integer atiende = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM odontologo_sucursal WHERE id_usuario = ? AND id_sucursal = ?",
                    Integer.class, odontologo.getIdUsuario(), idSucursal);
            if (atiende == null || atiende == 0) {
                throw error(HttpStatus.BAD_REQUEST, "No atiendes en la sucursal seleccionada.");
            }
        }

        Integer estadoPaciente = jdbcTemplate.queryForList(
                        "SELECT estado FROM paciente WHERE id_paciente = ?", Integer.class, idPaciente)
                .stream().findFirst()
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El paciente no existe."));
        if (estadoPaciente != 1) {
            throw error(HttpStatus.BAD_REQUEST, "El paciente está desactivado.");
        }

        List<AtencionRequest.TratamientoAplicado> tratamientos = validarTratamientos(request.tratamientos());
        Integer idFicha = fichaClinicaService.asegurarFicha(idPaciente);

        String diagnostico = texto(request.diagnostico(), "El diagnóstico");
        String observaciones = texto(request.observaciones(), "Las observaciones");
        String indicaciones = texto(request.indicaciones(), "Las indicaciones");
        Integer idCita = request.idCita();
        Integer idOdontologo = odontologo.getIdUsuario();
        Integer sucursal = idSucursal;

        KeyHolder llave = new GeneratedKeyHolder();
        jdbcTemplate.update(conexion -> {
            PreparedStatement ps = conexion.prepareStatement(
                    "INSERT INTO atencion (fecha_hora, estado, diagnostico, observaciones, indicaciones, "
                            + "id_cita, id_ficha, id_odontologo, id_sucursal) "
                            + "VALUES (?, 'BORRADOR', ?, ?, ?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now().withNano(0)));
            ps.setString(2, diagnostico);
            ps.setString(3, observaciones);
            ps.setString(4, indicaciones);
            if (idCita == null) {
                ps.setNull(5, java.sql.Types.INTEGER);
            } else {
                ps.setInt(5, idCita);
            }
            ps.setInt(6, idFicha);
            ps.setInt(7, idOdontologo);
            ps.setInt(8, sucursal);
            return ps;
        }, llave);

        Number id = llave.getKey();
        int idAtencion = id == null ? 0 : id.intValue();

        guardarTratamientos(idAtencion, tratamientos);
        return obtener(idAtencion);
    }

    @Transactional
    public AtencionResponse actualizar(Integer idAtencion, AtencionRequest request, String username) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos de la atención.");
        }

        validarBorradorPropio(idAtencion, username);
        List<AtencionRequest.TratamientoAplicado> tratamientos = validarTratamientos(request.tratamientos());

        jdbcTemplate.update(
                "UPDATE atencion SET diagnostico = ?, observaciones = ?, indicaciones = ? WHERE id_atencion = ?",
                texto(request.diagnostico(), "El diagnóstico"),
                texto(request.observaciones(), "Las observaciones"),
                texto(request.indicaciones(), "Las indicaciones"),
                idAtencion
        );

        borrarTratamientos(idAtencion);
        guardarTratamientos(idAtencion, tratamientos);

        return obtener(idAtencion);
    }

    /* =========================================================
       CERRAR / ELIMINAR
    ========================================================= */

    @Transactional
    public AtencionResponse cerrar(Integer idAtencion, String username) {

        Usuario odontologo = validarBorradorPropio(idAtencion, username);
        AtencionResponse atencion = obtener(idAtencion);

        boolean sinContenido = (atencion.diagnostico() == null || atencion.diagnostico().isBlank())
                && atencion.tratamientos().isEmpty();
        if (sinContenido) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Para cerrar la atención registra al menos el diagnóstico o un tratamiento.");
        }

        jdbcTemplate.update("UPDATE atencion SET estado = 'CERRADA' WHERE id_atencion = ?", idAtencion);

        // La cita asociada queda como completada (con su historial)
        if (atencion.idCita() != null) {
            String estadoCita = jdbcTemplate.queryForObject(
                    "SELECT estado FROM cita WHERE id_cita = ?", String.class, atencion.idCita());

            if ("RESERVADA".equals(estadoCita) || "CONFIRMADA".equals(estadoCita)) {
                jdbcTemplate.update(
                        "UPDATE cita SET estado = 'COMPLETADA' WHERE id_cita = ?", atencion.idCita());
                jdbcTemplate.update(
                        "INSERT INTO historial_cita (id_cita, id_usuario, estado_anterior, estado_nuevo, observacion) "
                                + "VALUES (?, ?, ?, 'COMPLETADA', ?)",
                        atencion.idCita(), odontologo.getIdUsuario(), estadoCita,
                        "Atención clínica registrada y cerrada"
                );
            }
        }

        return obtener(idAtencion);
    }

    /** Descarta un borrador (las atenciones cerradas no se eliminan). */
    @Transactional
    public void eliminarBorrador(Integer idAtencion, String username) {
        validarBorradorPropio(idAtencion, username);

        Integer pagos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pago WHERE id_atencion = ?", Integer.class, idAtencion);
        if (pagos != null && pagos > 0) {
            throw error(HttpStatus.CONFLICT, "La atención tiene pagos registrados y no se puede eliminar.");
        }

        borrarTratamientos(idAtencion);
        jdbcTemplate.update("DELETE FROM atencion WHERE id_atencion = ?", idAtencion);
    }

    /* =========================================================
       VALIDACIONES Y AUXILIARES
    ========================================================= */

    private Usuario validarBorradorPropio(Integer idAtencion, String username) {
        Usuario odontologo = odontologoActual(username);
        AtencionResponse atencion = obtener(idAtencion);

        if (!"BORRADOR".equals(atencion.estado())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La atención ya está cerrada y no se puede modificar.");
        }
        if (!atencion.idOdontologo().equals(odontologo.getIdUsuario())) {
            throw error(HttpStatus.FORBIDDEN,
                    "Solo el odontólogo que registró la atención puede modificarla.");
        }
        return odontologo;
    }

    /** Validación compartida con PresupuestoService. */
    public List<AtencionRequest.TratamientoAplicado> validarTratamientos(
            List<AtencionRequest.TratamientoAplicado> tratamientos) {

        if (tratamientos == null) {
            return List.of();
        }

        Set<Integer> vistos = new HashSet<>();

        for (AtencionRequest.TratamientoAplicado t : tratamientos) {

            if (t == null || t.idTratamiento() == null) {
                throw error(HttpStatus.BAD_REQUEST, "Hay un tratamiento sin seleccionar.");
            }
            if (!vistos.add(t.idTratamiento())) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Un tratamiento está repetido: usa la cantidad o agrega varias piezas.");
            }

            List<Integer> estado = jdbcTemplate.queryForList(
                    "SELECT estado FROM tratamiento WHERE id_tratamiento = ?", Integer.class, t.idTratamiento());
            if (estado.isEmpty()) {
                throw error(HttpStatus.BAD_REQUEST, "Uno de los tratamientos no existe.");
            }

            if (t.cantidad() == null || t.cantidad() < 1 || t.cantidad() > 99) {
                throw error(HttpStatus.BAD_REQUEST, "La cantidad de cada tratamiento debe estar entre 1 y 99.");
            }
            if (t.costoAplicado() == null || t.costoAplicado().signum() < 0
                    || t.costoAplicado().compareTo(new BigDecimal("99999999.99")) > 0) {
                throw error(HttpStatus.BAD_REQUEST, "Revisa el costo aplicado de los tratamientos.");
            }

            if (t.piezas() != null) {
                Set<String> piezasVistas = new HashSet<>();
                for (AtencionRequest.PiezaDental p : t.piezas()) {
                    if (p == null || p.pieza() == null || !p.pieza().trim().matches(REGEX_PIEZA)) {
                        throw error(HttpStatus.BAD_REQUEST,
                                "Hay una pieza dental no válida (usa el código FDI, ej: 11, 36, 55).");
                    }
                    if (!piezasVistas.add(p.pieza().trim())) {
                        throw error(HttpStatus.BAD_REQUEST, "Una pieza dental está repetida en el mismo tratamiento.");
                    }
                    String sup = p.superficies() == null ? "" : p.superficies().trim().toUpperCase();
                    if (!sup.isEmpty() && !sup.matches(REGEX_SUPERFICIES)) {
                        throw error(HttpStatus.BAD_REQUEST,
                                "Las superficies deben ser O, M, D, V, P o L separadas por coma.");
                    }
                    if (p.observacion() != null && p.observacion().length() > 250) {
                        throw error(HttpStatus.BAD_REQUEST,
                                "La observación de una pieza no puede superar 250 caracteres.");
                    }
                }
            }
        }

        return tratamientos;
    }

    private void guardarTratamientos(int idAtencion, List<AtencionRequest.TratamientoAplicado> tratamientos) {

        for (AtencionRequest.TratamientoAplicado t : tratamientos) {

            jdbcTemplate.update(
                    "INSERT INTO atencion_tratamiento (id_atencion, id_tratamiento, cantidad, costo_aplicado) "
                            + "VALUES (?, ?, ?, ?)",
                    idAtencion, t.idTratamiento(), t.cantidad(),
                    t.costoAplicado().setScale(2, RoundingMode.HALF_UP)
            );

            if (t.piezas() == null) {
                continue;
            }

            // Sin pieza no se inserta nada (nota 3 del script)
            for (AtencionRequest.PiezaDental p : t.piezas()) {
                String sup = p.superficies() == null || p.superficies().isBlank()
                        ? null
                        : p.superficies().trim().toUpperCase();
                String obs = p.observacion() == null || p.observacion().isBlank()
                        ? null
                        : p.observacion().trim();

                jdbcTemplate.update(
                        "INSERT INTO atencion_tratamiento_pieza "
                                + "(id_atencion, id_tratamiento, pieza_dental, superficies, observacion) "
                                + "VALUES (?, ?, ?, ?, ?)",
                        idAtencion, t.idTratamiento(), p.pieza().trim(), sup, obs
                );
            }
        }
    }

    private void borrarTratamientos(Integer idAtencion) {
        jdbcTemplate.update("DELETE FROM atencion_tratamiento_pieza WHERE id_atencion = ?", idAtencion);
        jdbcTemplate.update("DELETE FROM atencion_tratamiento WHERE id_atencion = ?", idAtencion);
    }

    private Map<String, Object> buscarCita(Integer idCita) {
        List<Map<String, Object>> filas = jdbcTemplate.queryForList(
                "SELECT id_paciente, id_odontologo, id_sucursal, estado FROM cita WHERE id_cita = ?",
                idCita
        );
        if (filas.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "La cita no existe.");
        }
        return filas.get(0);
    }

    private Usuario odontologoActual(String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
        if (usuario.getRol() != Rol.ODONTOLOGO) {
            throw error(HttpStatus.FORBIDDEN, "Solo un odontólogo puede registrar atenciones.");
        }
        return usuario;
    }

    private static String texto(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.length() > LARGO_TEXTO) {
            throw error(HttpStatus.BAD_REQUEST, campo + " no puede superar " + LARGO_TEXTO + " caracteres.");
        }
        return limpio;
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
