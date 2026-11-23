package cl.dentalsys.service;

import cl.dentalsys.dto.BloqueoRequest;
import cl.dentalsys.dto.BloqueoResponse;
import cl.dentalsys.dto.HorarioRequest;
import cl.dentalsys.dto.HorarioResponse;
import cl.dentalsys.model.BloqueoAgenda;
import cl.dentalsys.model.HorarioAtencion;
import cl.dentalsys.model.OdontologoSucursal;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.BloqueoAgendaRepository;
import cl.dentalsys.repository.HorarioAtencionRepository;
import cl.dentalsys.repository.OdontologoRepository;
import cl.dentalsys.repository.OdontologoSucursalRepository;
import cl.dentalsys.repository.SucursalRepository;
import cl.dentalsys.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Horarios de atención (horario_atencion) y bloqueos de agenda (bloqueo_agenda).
 * - Los horarios van en tramos de 30 minutos (ej: 09:00 a 13:30).
 * - Un odontólogo no puede tener dos horarios que se crucen el mismo día,
 *   aunque sean en sucursales distintas.
 * - Un bloqueo no borra citas: informa cuántas quedan dentro para que
 *   recepción las reprograme o cancele.
 */
@Service
public class HorarioService {

    private final HorarioAtencionRepository horarioRepository;
    private final BloqueoAgendaRepository bloqueoRepository;
    private final OdontologoRepository odontologoRepository;
    private final OdontologoSucursalRepository odontologoSucursalRepository;
    private final SucursalRepository sucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final JdbcTemplate jdbcTemplate;

    public HorarioService(
            HorarioAtencionRepository horarioRepository,
            BloqueoAgendaRepository bloqueoRepository,
            OdontologoRepository odontologoRepository,
            OdontologoSucursalRepository odontologoSucursalRepository,
            SucursalRepository sucursalRepository,
            UsuarioRepository usuarioRepository,
            JdbcTemplate jdbcTemplate) {

        this.horarioRepository = horarioRepository;
        this.bloqueoRepository = bloqueoRepository;
        this.odontologoRepository = odontologoRepository;
        this.odontologoSucursalRepository = odontologoSucursalRepository;
        this.sucursalRepository = sucursalRepository;
        this.usuarioRepository = usuarioRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* =========================================================
       HORARIOS
    ========================================================= */

    @Transactional(readOnly = true)
    public List<HorarioResponse> listarHorarios(Integer idOdontologo, String username) {

        Integer filtro = filtroOdontologo(idOdontologo, username);
        Map<Integer, String> odontologos = nombresOdontologos();
        Map<Integer, String> sucursales = nombresSucursales();

        List<HorarioAtencion> horarios = filtro != null
                ? horarioRepository.findByIdOdontologoOrderByDiaSemanaAscHoraInicioAsc(filtro)
                : horarioRepository.findAllByOrderByIdOdontologoAscDiaSemanaAscHoraInicioAsc();

        return horarios.stream()
                .map(h -> new HorarioResponse(
                        h.getIdHorario(),
                        h.getIdOdontologo(),
                        odontologos.getOrDefault(h.getIdOdontologo(), "Odontólogo"),
                        h.getIdSucursal(),
                        sucursales.getOrDefault(h.getIdSucursal(), "Sucursal"),
                        h.getDiaSemana(),
                        h.getHoraInicio(),
                        h.getHoraFin(),
                        Boolean.TRUE.equals(h.getEstado())
                ))
                .toList();
    }

    @Transactional
    public HorarioResponse crearHorario(HorarioRequest request) {
        HorarioAtencion horario = new HorarioAtencion();
        aplicarHorario(horario, request, 0);
        horarioRepository.save(horario);
        return aResponse(horario);
    }

    @Transactional
    public HorarioResponse actualizarHorario(Integer idHorario, HorarioRequest request) {
        HorarioAtencion horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El horario no existe."));
        aplicarHorario(horario, request, idHorario);
        horarioRepository.save(horario);
        return aResponse(horario);
    }

    /** Elimina un tramo de horario. Las citas ya agendadas se mantienen. */
    @Transactional
    public void eliminarHorario(Integer idHorario) {
        HorarioAtencion horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El horario no existe."));
        horarioRepository.delete(horario);
    }

    private void aplicarHorario(HorarioAtencion horario, HorarioRequest request, Integer idActual) {

        if (request == null
                || request.idOdontologo() == null
                || request.idSucursal() == null
                || request.diaSemana() == null
                || request.horaInicio() == null
                || request.horaFin() == null) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Completa odontólogo, sucursal, día, hora de inicio y hora de término.");
        }

        if (request.diaSemana() < 1 || request.diaSemana() > 7) {
            throw error(HttpStatus.BAD_REQUEST, "El día de la semana no es válido.");
        }

        LocalTime inicio = request.horaInicio().withSecond(0).withNano(0);
        LocalTime fin = request.horaFin().withSecond(0).withNano(0);

        if (inicio.getMinute() % 30 != 0 || fin.getMinute() % 30 != 0) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Usa horas completas o medias horas (ej: 09:00, 13:30).");
        }

        if (!inicio.isBefore(fin)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La hora de término debe ser posterior a la de inicio.");
        }

        validarOdontologoEnSucursal(request.idOdontologo(), request.idSucursal());

        boolean cruce = horarioRepository
                .findByIdOdontologoAndDiaSemanaAndEstadoTrue(
                        request.idOdontologo(),
                        request.diaSemana()
                )
                .stream()
                .anyMatch(h -> !h.getIdHorario().equals(idActual)
                        && h.getHoraInicio().isBefore(fin)
                        && h.getHoraFin().isAfter(inicio));

        if (cruce) {
            throw error(HttpStatus.CONFLICT,
                    "Ese tramo se cruza con otro horario del odontólogo el mismo día.");
        }

        horario.setIdOdontologo(request.idOdontologo());
        horario.setIdSucursal(request.idSucursal());
        horario.setDiaSemana(request.diaSemana());
        horario.setHoraInicio(inicio);
        horario.setHoraFin(fin);
        horario.setEstado(true);
    }

    private HorarioResponse aResponse(HorarioAtencion h) {
        return new HorarioResponse(
                h.getIdHorario(),
                h.getIdOdontologo(),
                nombresOdontologos().getOrDefault(h.getIdOdontologo(), "Odontólogo"),
                h.getIdSucursal(),
                nombresSucursales().getOrDefault(h.getIdSucursal(), "Sucursal"),
                h.getDiaSemana(),
                h.getHoraInicio(),
                h.getHoraFin(),
                Boolean.TRUE.equals(h.getEstado())
        );
    }

    /* =========================================================
       BLOQUEOS
    ========================================================= */

    /** Bloqueos activos vigentes o futuros. */
    @Transactional(readOnly = true)
    public List<BloqueoResponse> listarBloqueos(Integer idOdontologo, String username) {

        Integer filtro = filtroOdontologo(idOdontologo, username);

        return bloqueoRepository.buscarVigentes(LocalDateTime.now())
                .stream()
                .filter(b -> filtro == null || b.getIdOdontologo().equals(filtro))
                .map(this::aResponse)
                .toList();
    }

    /** Crea el bloqueo en una sucursal o, si no se indica, en todas las del odontólogo. */
    @Transactional
    public List<BloqueoResponse> crearBloqueo(BloqueoRequest request) {

        if (request == null
                || request.idOdontologo() == null
                || request.fechaHoraInicio() == null
                || request.fechaHoraFin() == null) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Completa odontólogo, fecha y hora de inicio y de término.");
        }

        LocalDateTime inicio = request.fechaHoraInicio().withSecond(0).withNano(0);
        LocalDateTime fin = request.fechaHoraFin().withSecond(0).withNano(0);

        if (!inicio.isBefore(fin)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El término del bloqueo debe ser posterior al inicio.");
        }

        if (!fin.isAfter(LocalDateTime.now())) {
            throw error(HttpStatus.BAD_REQUEST, "El bloqueo ya terminó: revisa las fechas.");
        }

        String motivo = request.motivo() == null || request.motivo().isBlank()
                ? null
                : request.motivo().trim();

        if (motivo != null && motivo.length() > 200) {
            throw error(HttpStatus.BAD_REQUEST, "El motivo no puede superar 200 caracteres.");
        }

        if (odontologoRepository.findById(request.idOdontologo()).isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El odontólogo no existe.");
        }

        List<Integer> sucursales = new ArrayList<>();

        if (request.idSucursal() != null) {
            validarOdontologoEnSucursal(request.idOdontologo(), request.idSucursal());
            sucursales.add(request.idSucursal());
        } else {
            odontologoSucursalRepository.findByIdUsuario(request.idOdontologo())
                    .stream()
                    .map(OdontologoSucursal::getIdSucursal)
                    .forEach(sucursales::add);
        }

        if (sucursales.isEmpty()) {
            throw error(HttpStatus.BAD_REQUEST, "El odontólogo no tiene sucursales asignadas.");
        }

        List<BloqueoResponse> creados = new ArrayList<>();

        for (Integer idSucursal : sucursales) {
            BloqueoAgenda bloqueo = new BloqueoAgenda();
            bloqueo.setIdOdontologo(request.idOdontologo());
            bloqueo.setIdSucursal(idSucursal);
            bloqueo.setFechaHoraInicio(inicio);
            bloqueo.setFechaHoraFin(fin);
            bloqueo.setMotivo(motivo);
            bloqueo.setEstado(true);
            bloqueoRepository.save(bloqueo);
            creados.add(aResponse(bloqueo));
        }

        return creados;
    }

    /** Anula un bloqueo (queda guardado como inactivo). */
    @Transactional
    public void anularBloqueo(Integer idBloqueo) {
        BloqueoAgenda bloqueo = bloqueoRepository.findById(idBloqueo)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El bloqueo no existe."));
        bloqueo.setEstado(false);
        bloqueoRepository.save(bloqueo);
    }

    private BloqueoResponse aResponse(BloqueoAgenda b) {

        Long afectadas = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM cita WHERE id_odontologo = ? AND id_sucursal = ? "
                        + "AND estado IN ('RESERVADA', 'CONFIRMADA') "
                        + "AND fecha_hora < ? AND fecha_hora_fin > ?",
                Long.class,
                b.getIdOdontologo(),
                b.getIdSucursal(),
                Timestamp.valueOf(b.getFechaHoraFin()),
                Timestamp.valueOf(b.getFechaHoraInicio())
        );

        return new BloqueoResponse(
                b.getIdBloqueo(),
                b.getIdOdontologo(),
                nombresOdontologos().getOrDefault(b.getIdOdontologo(), "Odontólogo"),
                b.getIdSucursal(),
                nombresSucursales().getOrDefault(b.getIdSucursal(), "Sucursal"),
                b.getFechaHoraInicio(),
                b.getFechaHoraFin(),
                b.getMotivo(),
                afectadas == null ? 0 : afectadas
        );
    }

    /* =========================================================
       UTILIDADES
    ========================================================= */

    /** Un ODONTOLOGO solo ve sus propios horarios y bloqueos. */
    private Integer filtroOdontologo(Integer idOdontologo, String username) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));

        return usuario.getRol() == Rol.ODONTOLOGO ? usuario.getIdUsuario() : idOdontologo;
    }

    private void validarOdontologoEnSucursal(Integer idOdontologo, Integer idSucursal) {

        if (odontologoRepository.findById(idOdontologo).isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "El odontólogo no existe.");
        }

        if (sucursalRepository.findById(idSucursal).isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "La sucursal no existe.");
        }

        if (!odontologoSucursalRepository.existsByIdUsuarioAndIdSucursal(idOdontologo, idSucursal)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El odontólogo no atiende en esa sucursal. Asígnala primero en Usuarios.");
        }
    }

    private Map<Integer, String> nombresOdontologos() {
        Map<Integer, String> nombres = new HashMap<>();
        jdbcTemplate.query(
                "SELECT u.id_usuario, u.nombres, u.apellidos FROM odontologo o "
                        + "JOIN usuario u ON u.id_usuario = o.id_usuario",
                rs -> {
                    nombres.put(
                            rs.getInt("id_usuario"),
                            rs.getString("nombres") + " " + rs.getString("apellidos")
                    );
                }
        );
        return nombres;
    }

    private Map<Integer, String> nombresSucursales() {
        Map<Integer, String> nombres = new HashMap<>();
        sucursalRepository.findAll()
                .forEach(s -> nombres.put(s.getIdSucursal(), s.getNombre()));
        return nombres;
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
