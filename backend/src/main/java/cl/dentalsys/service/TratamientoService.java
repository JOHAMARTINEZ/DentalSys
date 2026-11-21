package cl.dentalsys.service;

import cl.dentalsys.dto.TratamientoRequest;
import cl.dentalsys.dto.TratamientoResponse;
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
import java.util.List;

/**
 * Catálogo de tratamientos (tabla tratamiento), con SQL directo.
 * No se eliminan: se desactivan para conservar atenciones y presupuestos.
 */
@Service
public class TratamientoService {

    private static final BigDecimal COSTO_MAXIMO = new BigDecimal("99999999.99");

    private static final String SELECT = """
            SELECT t.id_tratamiento, t.nombre, t.descripcion, t.costo_base, t.estado,
                   (SELECT COUNT(*) FROM atencion_tratamiento a WHERE a.id_tratamiento = t.id_tratamiento)
                 + (SELECT COUNT(*) FROM presupuesto_tratamiento p WHERE p.id_tratamiento = t.id_tratamiento) AS usos
            FROM tratamiento t
            """;

    private static final RowMapper<TratamientoResponse> MAPEO = (rs, fila) -> new TratamientoResponse(
            rs.getInt("id_tratamiento"),
            rs.getString("nombre"),
            rs.getString("descripcion"),
            rs.getBigDecimal("costo_base"),
            rs.getInt("estado") == 1,
            rs.getLong("usos")
    );

    private final JdbcTemplate jdbcTemplate;

    public TratamientoService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<TratamientoResponse> listar(boolean incluirInactivos) {
        String filtro = incluirInactivos ? "" : " WHERE t.estado = 1";
        return jdbcTemplate.query(SELECT + filtro + " ORDER BY t.nombre ASC", MAPEO);
    }

    @Transactional(readOnly = true)
    public TratamientoResponse obtener(Integer id) {
        List<TratamientoResponse> lista = jdbcTemplate.query(
                SELECT + " WHERE t.id_tratamiento = ?", MAPEO, id);
        if (lista.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El tratamiento no existe.");
        }
        return lista.get(0);
    }

    @Transactional
    public TratamientoResponse crear(TratamientoRequest request) {
        Datos datos = validar(request, 0);

        KeyHolder llave = new GeneratedKeyHolder();
        jdbcTemplate.update(conexion -> {
            PreparedStatement ps = conexion.prepareStatement(
                    "INSERT INTO tratamiento (nombre, descripcion, costo_base, estado) VALUES (?, ?, ?, 1)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, datos.nombre());
            ps.setString(2, datos.descripcion());
            ps.setBigDecimal(3, datos.costo());
            return ps;
        }, llave);

        Number id = llave.getKey();
        return obtener(id == null ? 0 : id.intValue());
    }

    @Transactional
    public TratamientoResponse actualizar(Integer id, TratamientoRequest request) {
        obtener(id);
        Datos datos = validar(request, id);

        jdbcTemplate.update(
                "UPDATE tratamiento SET nombre = ?, descripcion = ?, costo_base = ? WHERE id_tratamiento = ?",
                datos.nombre(), datos.descripcion(), datos.costo(), id
        );

        return obtener(id);
    }

    @Transactional
    public TratamientoResponse cambiarEstado(Integer id, boolean activar) {
        obtener(id);
        jdbcTemplate.update(
                "UPDATE tratamiento SET estado = ? WHERE id_tratamiento = ?",
                activar ? 1 : 0, id
        );
        return obtener(id);
    }

    private record Datos(String nombre, String descripcion, BigDecimal costo) {
    }

    private Datos validar(TratamientoRequest request, Integer idActual) {

        if (request == null || request.nombre() == null || request.nombre().isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, "El nombre del tratamiento es obligatorio.");
        }

        String nombre = request.nombre().trim();
        if (nombre.length() > 150) {
            throw error(HttpStatus.BAD_REQUEST, "El nombre no puede superar 150 caracteres.");
        }

        if (request.costoBase() == null) {
            throw error(HttpStatus.BAD_REQUEST, "El costo base es obligatorio.");
        }

        BigDecimal costo = request.costoBase().setScale(2, RoundingMode.HALF_UP);
        if (costo.signum() < 0 || costo.compareTo(COSTO_MAXIMO) > 0) {
            throw error(HttpStatus.BAD_REQUEST, "El costo base no es válido.");
        }

        Integer repetidos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tratamiento WHERE LOWER(nombre) = LOWER(?) AND id_tratamiento <> ?",
                Integer.class, nombre, idActual
        );
        if (repetidos != null && repetidos > 0) {
            throw error(HttpStatus.CONFLICT, "Ya existe un tratamiento con ese nombre.");
        }

        String descripcion = request.descripcion() == null || request.descripcion().isBlank()
                ? null
                : request.descripcion().trim();

        return new Datos(nombre, descripcion, costo);
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
