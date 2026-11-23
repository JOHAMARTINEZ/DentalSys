package cl.dentalsys.service;

import cl.dentalsys.dto.PacienteRequest;
import cl.dentalsys.dto.PacienteResponse;
import cl.dentalsys.model.Paciente;
import cl.dentalsys.repository.PacienteRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

/**
 * Pacientes (gestión).
 * - El RUT se guarda sin puntos ni guion y es único.
 * - Para menores de 18 años se exige el nombre del apoderado.
 * - No se eliminan pacientes: se desactivan (conservan su historial).
 */
@Service
public class PacienteService {

    private static final String REGEX_CORREO = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";

    // Paciente + resumen de citas + cuenta del portal
    private static final String SELECT_PACIENTE = """
            SELECT p.*, u.username AS cuenta,
                   (SELECT COUNT(*) FROM cita c WHERE c.id_paciente = p.id_paciente) AS total_citas,
                   (SELECT MIN(c.fecha_hora) FROM cita c
                     WHERE c.id_paciente = p.id_paciente
                       AND c.fecha_hora >= NOW()
                       AND c.estado IN ('RESERVADA', 'CONFIRMADA')) AS proxima_cita,
                   (SELECT MAX(c.fecha_hora) FROM cita c
                     WHERE c.id_paciente = p.id_paciente
                       AND c.estado = 'COMPLETADA') AS ultima_completada
            FROM paciente p
            LEFT JOIN usuario u ON u.id_usuario = p.id_usuario
            """;

    private static final RowMapper<PacienteResponse> MAPEO = (rs, fila) -> {
        Date nacimiento = rs.getDate("fecha_nacimiento");
        LocalDate fechaNacimiento = nacimiento == null ? null : nacimiento.toLocalDate();
        Timestamp proxima = rs.getTimestamp("proxima_cita");
        Timestamp ultima = rs.getTimestamp("ultima_completada");
        String cuenta = rs.getString("cuenta");

        return new PacienteResponse(
                rs.getInt("id_paciente"),
                RutValidator.formatear(rs.getString("rut")),
                rs.getString("nombres"),
                rs.getString("apellidos"),
                fechaNacimiento,
                fechaNacimiento == null ? null : Period.between(fechaNacimiento, LocalDate.now()).getYears(),
                rs.getString("telefono"),
                rs.getString("correo"),
                rs.getString("direccion"),
                rs.getString("apoderado_nombre"),
                rs.getString("apoderado_rut") == null ? null : RutValidator.formatear(rs.getString("apoderado_rut")),
                rs.getString("apoderado_telefono"),
                rs.getInt("estado") == 1,
                cuenta != null,
                cuenta,
                rs.getLong("total_citas"),
                proxima == null ? null : proxima.toLocalDateTime(),
                ultima == null ? null : ultima.toLocalDateTime()
        );
    };

    private final PacienteRepository pacienteRepository;
    private final JdbcTemplate jdbcTemplate;

    public PacienteService(
            PacienteRepository pacienteRepository,
            JdbcTemplate jdbcTemplate) {
        this.pacienteRepository = pacienteRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* =========================================================
       CONSULTAS
    ========================================================= */

    /**
     * Lista pacientes. texto: busca en nombre, apellidos, RUT, correo o teléfono.
     * estado: "ACTIVOS", "INACTIVOS" o vacío (todos).
     */
    @Transactional(readOnly = true)
    public List<PacienteResponse> listar(String texto, String estado) {

        StringBuilder sql = new StringBuilder(SELECT_PACIENTE).append(" WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (texto != null && !texto.isBlank()) {
            String limpio = texto.trim().toLowerCase();
            String like = "%" + limpio + "%";
            String rutLike = "%" + RutValidator.normalizar(limpio) + "%";

            sql.append(" AND (LOWER(CONCAT(p.nombres, ' ', p.apellidos)) LIKE ?"
                    + " OR p.rut LIKE ? OR LOWER(p.correo) LIKE ? OR p.telefono LIKE ?)");
            parametros.add(like);
            parametros.add(rutLike.toUpperCase());
            parametros.add(like);
            parametros.add(like);
        }

        if ("ACTIVOS".equalsIgnoreCase(estado)) {
            sql.append(" AND p.estado = 1");
        } else if ("INACTIVOS".equalsIgnoreCase(estado)) {
            sql.append(" AND p.estado = 0");
        }

        sql.append(" ORDER BY p.apellidos ASC, p.nombres ASC LIMIT 1000");

        return jdbcTemplate.query(sql.toString(), MAPEO, parametros.toArray());
    }

    @Transactional(readOnly = true)
    public PacienteResponse obtener(Integer idPaciente) {
        List<PacienteResponse> resultado = jdbcTemplate.query(
                SELECT_PACIENTE + " WHERE p.id_paciente = ?",
                MAPEO,
                idPaciente
        );

        if (resultado.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El paciente no existe.");
        }

        return resultado.get(0);
    }

    @Transactional(readOnly = true)
    public PacienteResponse buscarPorRut(String rut) {
        String normalizado = RutValidator.normalizar(rut);

        List<PacienteResponse> resultado = jdbcTemplate.query(
                SELECT_PACIENTE + " WHERE p.rut = ?",
                MAPEO,
                normalizado
        );

        if (resultado.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "No hay un paciente registrado con ese RUT.");
        }

        return resultado.get(0);
    }

    /* =========================================================
       REGISTRAR / EDITAR / ESTADO
    ========================================================= */

    @Transactional
    public PacienteResponse registrar(PacienteRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del paciente.");
        }

        String rut = textoObligatorio(request.rut(), "El RUT es obligatorio.");

        if (!RutValidator.esValido(rut)) {
            throw error(HttpStatus.BAD_REQUEST, "El RUT ingresado no es válido.");
        }

        rut = RutValidator.normalizar(rut);

        if (pacienteRepository.existsByRut(rut)) {
            throw error(HttpStatus.CONFLICT,
                    "Ya existe un paciente con el RUT " + RutValidator.formatear(rut) + ".");
        }

        Paciente paciente = new Paciente();
        paciente.setRut(rut);
        paciente.setEstado(1);
        aplicarDatos(paciente, request);

        Paciente guardado = pacienteRepository.save(paciente);
        return obtener(guardado.getIdPaciente());
    }

    /** El RUT no se modifica (identifica al paciente en citas y ficha). */
    @Transactional
    public PacienteResponse actualizar(Integer idPaciente, PacienteRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del paciente.");
        }

        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El paciente no existe."));

        aplicarDatos(paciente, request);
        pacienteRepository.save(paciente);

        return obtener(idPaciente);
    }

    @Transactional
    public PacienteResponse cambiarEstado(Integer idPaciente, boolean activar) {

        Paciente paciente = pacienteRepository.findById(idPaciente)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El paciente no existe."));

        paciente.setEstado(activar ? 1 : 0);
        pacienteRepository.save(paciente);

        return obtener(idPaciente);
    }

    /* =========================================================
       VALIDACIONES
    ========================================================= */

    private void aplicarDatos(Paciente paciente, PacienteRequest request) {

        String nombres = textoObligatorio(request.nombres(), "Los nombres son obligatorios.");
        String apellidos = textoObligatorio(request.apellidos(), "Los apellidos son obligatorios.");

        validarLargo(nombres, 100, "Los nombres no pueden superar 100 caracteres.");
        validarLargo(apellidos, 100, "Los apellidos no pueden superar 100 caracteres.");

        LocalDate nacimiento = request.fechaNacimiento();

        if (nacimiento == null) {
            throw error(HttpStatus.BAD_REQUEST, "La fecha de nacimiento es obligatoria.");
        }

        if (nacimiento.isAfter(LocalDate.now())) {
            throw error(HttpStatus.BAD_REQUEST, "La fecha de nacimiento no puede ser futura.");
        }

        if (nacimiento.isBefore(LocalDate.now().minusYears(120))) {
            throw error(HttpStatus.BAD_REQUEST, "Revisa la fecha de nacimiento.");
        }

        String telefono = textoOpcional(request.telefono());
        String correo = textoOpcional(request.correo());
        String direccion = textoOpcional(request.direccion());

        if (telefono != null) {
            validarLargo(telefono, 20, "El teléfono no puede superar 20 caracteres.");
        }

        if (correo != null) {
            correo = correo.toLowerCase();
            validarLargo(correo, 150, "El correo no puede superar 150 caracteres.");
            if (!correo.matches(REGEX_CORREO)) {
                throw error(HttpStatus.BAD_REQUEST, "El correo ingresado no es válido.");
            }
        }

        if (direccion != null) {
            validarLargo(direccion, 200, "La dirección no puede superar 200 caracteres.");
        }

        // Apoderado
        String apoderadoNombre = textoOpcional(request.apoderadoNombre());
        String apoderadoRut = textoOpcional(request.apoderadoRut());
        String apoderadoTelefono = textoOpcional(request.apoderadoTelefono());

        boolean esMenor = Period.between(nacimiento, LocalDate.now()).getYears() < 18;

        if (esMenor && apoderadoNombre == null) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El paciente es menor de edad: ingresa el nombre del apoderado.");
        }

        if (apoderadoNombre != null) {
            validarLargo(apoderadoNombre, 150, "El nombre del apoderado no puede superar 150 caracteres.");
        }

        if (apoderadoRut != null) {
            if (!RutValidator.esValido(apoderadoRut)) {
                throw error(HttpStatus.BAD_REQUEST, "El RUT del apoderado no es válido.");
            }
            apoderadoRut = RutValidator.normalizar(apoderadoRut);
        }

        if (apoderadoTelefono != null) {
            validarLargo(apoderadoTelefono, 20, "El teléfono del apoderado no puede superar 20 caracteres.");
        }

        paciente.setNombres(nombres);
        paciente.setApellidos(apellidos);
        paciente.setFechaNacimiento(nacimiento);
        paciente.setTelefono(telefono);
        paciente.setCorreo(correo);
        paciente.setDireccion(direccion);
        paciente.setApoderadoNombre(apoderadoNombre);
        paciente.setApoderadoRut(apoderadoRut);
        paciente.setApoderadoTelefono(apoderadoTelefono);
    }

    private static String textoObligatorio(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, mensaje);
        }
        return valor.trim();
    }

    private static String textoOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private static void validarLargo(String valor, int maximo, String mensaje) {
        if (valor.length() > maximo) {
            throw error(HttpStatus.BAD_REQUEST, mensaje);
        }
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
