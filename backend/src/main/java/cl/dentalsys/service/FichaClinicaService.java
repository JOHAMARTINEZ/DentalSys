package cl.dentalsys.service;

import cl.dentalsys.dto.FichaRequest;
import cl.dentalsys.dto.FichaResponse;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

/**
 * Ficha clínica (tabla ficha_clinica): una por paciente.
 * Se crea automáticamente al guardarla por primera vez o al registrar
 * la primera atención del paciente.
 */
@Service
public class FichaClinicaService {

    private static final int LARGO_MAXIMO = 5000;

    private final JdbcTemplate jdbcTemplate;

    public FichaClinicaService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public FichaResponse obtener(Integer idPaciente) {

        List<FichaResponse> resultado = jdbcTemplate.query(
                """
                SELECT p.id_paciente, p.rut, p.nombres, p.apellidos, p.fecha_nacimiento,
                       p.telefono, p.correo, p.apoderado_nombre, p.estado,
                       f.id_ficha, f.fecha_apertura, f.antecedentes_medicos, f.alergias, f.observaciones
                FROM paciente p
                LEFT JOIN ficha_clinica f ON f.id_paciente = p.id_paciente
                WHERE p.id_paciente = ?
                """,
                (rs, fila) -> {
                    Date nacimiento = rs.getDate("fecha_nacimiento");
                    LocalDate fechaNacimiento = nacimiento == null ? null : nacimiento.toLocalDate();
                    Date apertura = rs.getDate("fecha_apertura");
                    int idFicha = rs.getInt("id_ficha");
                    boolean sinFicha = rs.wasNull();

                    return new FichaResponse(
                            sinFicha ? null : idFicha,
                            apertura == null ? null : apertura.toLocalDate(),
                            rs.getString("antecedentes_medicos"),
                            rs.getString("alergias"),
                            rs.getString("observaciones"),
                            rs.getInt("id_paciente"),
                            rs.getString("nombres") + " " + rs.getString("apellidos"),
                            RutValidator.formatear(rs.getString("rut")),
                            fechaNacimiento,
                            fechaNacimiento == null ? null
                                    : Period.between(fechaNacimiento, LocalDate.now()).getYears(),
                            rs.getString("telefono"),
                            rs.getString("correo"),
                            rs.getString("apoderado_nombre"),
                            rs.getInt("estado") == 1
                    );
                },
                idPaciente
        );

        if (resultado.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El paciente no existe.");
        }

        return resultado.get(0);
    }

    @Transactional
    public FichaResponse guardar(Integer idPaciente, FichaRequest request) {

        obtener(idPaciente);
        Integer idFicha = asegurarFicha(idPaciente);

        jdbcTemplate.update(
                "UPDATE ficha_clinica SET antecedentes_medicos = ?, alergias = ?, observaciones = ? "
                        + "WHERE id_ficha = ?",
                texto(request == null ? null : request.antecedentesMedicos(), "Los antecedentes médicos"),
                texto(request == null ? null : request.alergias(), "Las alergias"),
                texto(request == null ? null : request.observaciones(), "Las observaciones"),
                idFicha
        );

        return obtener(idPaciente);
    }

    /** Devuelve el id de la ficha del paciente; si no existe, la crea con fecha de hoy. */
    @Transactional
    public Integer asegurarFicha(Integer idPaciente) {

        List<Integer> existente = jdbcTemplate.queryForList(
                "SELECT id_ficha FROM ficha_clinica WHERE id_paciente = ?",
                Integer.class,
                idPaciente
        );

        if (!existente.isEmpty()) {
            return existente.get(0);
        }

        jdbcTemplate.update(
                "INSERT INTO ficha_clinica (fecha_apertura, id_paciente) VALUES (?, ?)",
                Date.valueOf(LocalDate.now()),
                idPaciente
        );

        return jdbcTemplate.queryForObject(
                "SELECT id_ficha FROM ficha_clinica WHERE id_paciente = ?",
                Integer.class,
                idPaciente
        );
    }

    private static String texto(String valor, String campo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.length() > LARGO_MAXIMO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    campo + " no pueden superar " + LARGO_MAXIMO + " caracteres.");
        }
        return limpio;
    }
}
