package cl.dentalsys.service;

import cl.dentalsys.dto.CambioEstadoCitaRequest;
import cl.dentalsys.dto.CitaRequest;
import cl.dentalsys.dto.CitaResponse;
import cl.dentalsys.dto.DisponibilidadResponse;
import cl.dentalsys.dto.HistorialCitaResponse;
import cl.dentalsys.dto.ReprogramarCitaRequest;
import cl.dentalsys.dto.ReservaCitaPacienteRequest;
import cl.dentalsys.dto.ReservaPublicaRequest;
import cl.dentalsys.model.BloqueoAgenda;
import cl.dentalsys.model.Cita;
import cl.dentalsys.model.EstadoCita;
import cl.dentalsys.model.HorarioAtencion;
import cl.dentalsys.model.MotivoCita;
import cl.dentalsys.model.Odontologo;
import cl.dentalsys.model.Paciente;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Sucursal;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.BloqueoAgendaRepository;
import cl.dentalsys.repository.CitaRepository;
import cl.dentalsys.repository.HorarioAtencionRepository;
import cl.dentalsys.repository.MotivoCitaRepository;
import cl.dentalsys.repository.OdontologoRepository;
import cl.dentalsys.repository.OdontologoSucursalRepository;
import cl.dentalsys.repository.PacienteRepository;
import cl.dentalsys.repository.SucursalRepository;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Agenda de citas.
 *
 * Reglas (incluye las "NOTAS IMPORTANTES PARA BACKEND" del script v2):
 * - Las citas comienzan a las :00 o :30 y duran lo que indica el tipo de
 *   atención (motivo_cita.duracion_minutos); sin tipo, 30 minutos.
 * - Deben quedar dentro del horario de atención del odontólogo en esa
 *   sucursal (horario_atencion) y fuera de sus bloqueos (bloqueo_agenda).
 * - No se permiten cruces de horario: ni el odontólogo ni el paciente
 *   pueden tener dos citas no canceladas que se superpongan.
 *   Para evitar reservas simultáneas, se bloquea la fila del odontólogo
 *   (SELECT ... FOR UPDATE) mientras se valida y se guarda.
 * - Cada creación y cambio de estado queda en historial_cita.
 * - Estados: RESERVADA -> CONFIRMADA -> COMPLETADA / NO_ASISTIO;
 *   RESERVADA o CONFIRMADA -> CANCELADA. COMPLETADA, CANCELADA y NO_ASISTIO
 *   son finales.
 */
@Service
public class CitaService {

    private static final int INTERVALO_MINUTOS = 30;
    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private static final String SELECT_CITA = """
            SELECT c.id_cita, c.fecha_hora, c.fecha_hora_fin, c.estado, c.motivo,
                   c.id_motivo, m.nombre AS tipo_atencion,
                   c.id_paciente, p.nombres AS p_nombres, p.apellidos AS p_apellidos,
                   p.rut AS p_rut, p.telefono AS p_telefono, p.correo AS p_correo,
                   c.id_odontologo, uo.nombres AS o_nombres, uo.apellidos AS o_apellidos,
                   o.especialidad,
                   c.id_sucursal, s.nombre AS s_nombre, s.direccion AS s_direccion,
                   c.fecha_creacion,
                   uc.nombres AS c_nombres, uc.apellidos AS c_apellidos, uc.rol AS c_rol
            FROM cita c
            JOIN paciente p ON p.id_paciente = c.id_paciente
            JOIN odontologo o ON o.id_usuario = c.id_odontologo
            JOIN usuario uo ON uo.id_usuario = c.id_odontologo
            JOIN sucursal s ON s.id_sucursal = c.id_sucursal
            LEFT JOIN motivo_cita m ON m.id_motivo = c.id_motivo
            LEFT JOIN usuario uc ON uc.id_usuario = c.id_usuario_creador
            """;

    private static final RowMapper<CitaResponse> MAPEO_CITA = (rs, fila) -> {
        Timestamp creacion = rs.getTimestamp("fecha_creacion");
        String creador = rs.getString("c_nombres");
        String rolCreador = rs.getString("c_rol");

        String creadaPor = null;
        if (creador != null) {
            creadaPor = "PACIENTE".equals(rolCreador)
                    ? "Paciente (portal)"
                    : creador + " " + rs.getString("c_apellidos");
        }

        int idMotivo = rs.getInt("id_motivo");
        Integer idMotivoNullable = rs.wasNull() ? null : idMotivo;

        return new CitaResponse(
                rs.getInt("id_cita"),
                rs.getTimestamp("fecha_hora").toLocalDateTime(),
                rs.getTimestamp("fecha_hora_fin").toLocalDateTime(),
                rs.getString("estado"),
                rs.getString("motivo"),
                idMotivoNullable,
                rs.getString("tipo_atencion"),
                rs.getInt("id_paciente"),
                rs.getString("p_nombres") + " " + rs.getString("p_apellidos"),
                RutValidator.formatear(rs.getString("p_rut")),
                rs.getString("p_telefono"),
                rs.getString("p_correo"),
                rs.getInt("id_odontologo"),
                rs.getString("o_nombres") + " " + rs.getString("o_apellidos"),
                rs.getString("especialidad"),
                rs.getInt("id_sucursal"),
                rs.getString("s_nombre"),
                rs.getString("s_direccion"),
                creacion == null ? null : creacion.toLocalDateTime(),
                creadaPor
        );
    };

    private final CitaRepository citaRepository;
    private final PacienteRepository pacienteRepository;
    private final OdontologoRepository odontologoRepository;
    private final SucursalRepository sucursalRepository;
    private final OdontologoSucursalRepository odontologoSucursalRepository;
    private final UsuarioRepository usuarioRepository;
    private final MotivoCitaRepository motivoCitaRepository;
    private final HorarioAtencionRepository horarioRepository;
    private final BloqueoAgendaRepository bloqueoRepository;
    private final JdbcTemplate jdbcTemplate;

    public CitaService(
            CitaRepository citaRepository,
            PacienteRepository pacienteRepository,
            OdontologoRepository odontologoRepository,
            SucursalRepository sucursalRepository,
            OdontologoSucursalRepository odontologoSucursalRepository,
            UsuarioRepository usuarioRepository,
            MotivoCitaRepository motivoCitaRepository,
            HorarioAtencionRepository horarioRepository,
            BloqueoAgendaRepository bloqueoRepository,
            JdbcTemplate jdbcTemplate) {

        this.citaRepository = citaRepository;
        this.pacienteRepository = pacienteRepository;
        this.odontologoRepository = odontologoRepository;
        this.sucursalRepository = sucursalRepository;
        this.odontologoSucursalRepository = odontologoSucursalRepository;
        this.usuarioRepository = usuarioRepository;
        this.motivoCitaRepository = motivoCitaRepository;
        this.horarioRepository = horarioRepository;
        this.bloqueoRepository = bloqueoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* =========================================================
       CONSULTAS (gestión)
    ========================================================= */

    /**
     * Lista citas con filtros opcionales. Un ODONTOLOGO solo ve las suyas.
     * Sin fechas y con idPaciente: todas las del paciente, de la más reciente
     * a la más antigua.
     */
    @Transactional(readOnly = true)
    public List<CitaResponse> listar(
            LocalDate desde,
            LocalDate hasta,
            Integer idOdontologo,
            Integer idSucursal,
            Integer idPaciente,
            String estado,
            String username) {

        Usuario usuario = usuarioActual(username);

        if (usuario.getRol() == Rol.ODONTOLOGO) {
            idOdontologo = usuario.getIdUsuario();
        }

        StringBuilder sql = new StringBuilder(SELECT_CITA).append(" WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (desde != null) {
            sql.append(" AND c.fecha_hora >= ?");
            parametros.add(Timestamp.valueOf(desde.atStartOfDay()));
        }

        if (hasta != null) {
            sql.append(" AND c.fecha_hora < ?");
            parametros.add(Timestamp.valueOf(hasta.plusDays(1).atStartOfDay()));
        }

        if (idOdontologo != null) {
            sql.append(" AND c.id_odontologo = ?");
            parametros.add(idOdontologo);
        }

        if (idSucursal != null) {
            sql.append(" AND c.id_sucursal = ?");
            parametros.add(idSucursal);
        }

        if (idPaciente != null) {
            sql.append(" AND c.id_paciente = ?");
            parametros.add(idPaciente);
        }

        if (estado != null && !estado.isBlank()) {
            sql.append(" AND c.estado = ?");
            parametros.add(leerEstado(estado).name());
        }

        boolean historialPaciente = idPaciente != null && desde == null && hasta == null;
        sql.append(historialPaciente
                ? " ORDER BY c.fecha_hora DESC"
                : " ORDER BY c.fecha_hora ASC");
        sql.append(" LIMIT 1000");

        return jdbcTemplate.query(sql.toString(), MAPEO_CITA, parametros.toArray());
    }

    @Transactional(readOnly = true)
    public CitaResponse obtener(Integer idCita, String username) {
        Usuario usuario = usuarioActual(username);
        CitaResponse cita = buscarResponse(idCita);

        if (usuario.getRol() == Rol.ODONTOLOGO
                && !cita.idOdontologo().equals(usuario.getIdUsuario())) {
            throw error(HttpStatus.FORBIDDEN, "Esta cita pertenece a otro odontólogo.");
        }

        return cita;
    }

    @Transactional(readOnly = true)
    public List<HistorialCitaResponse> historial(Integer idCita, String username) {

        // Valida que exista y que el usuario pueda verla
        obtener(idCita, username);

        return jdbcTemplate.query(
                """
                SELECT h.id_historial, h.estado_anterior, h.estado_nuevo, h.fecha_cambio,
                       h.observacion, u.nombres, u.apellidos, u.rol
                FROM historial_cita h
                LEFT JOIN usuario u ON u.id_usuario = h.id_usuario
                WHERE h.id_cita = ?
                ORDER BY h.fecha_cambio ASC, h.id_historial ASC
                """,
                (rs, fila) -> {
                    String nombre = rs.getString("nombres");
                    String quien = nombre == null
                            ? null
                            : "PACIENTE".equals(rs.getString("rol"))
                                ? "Paciente (portal)"
                                : nombre + " " + rs.getString("apellidos");

                    return new HistorialCitaResponse(
                            rs.getInt("id_historial"),
                            rs.getString("estado_anterior"),
                            rs.getString("estado_nuevo"),
                            rs.getTimestamp("fecha_cambio").toLocalDateTime(),
                            quien,
                            rs.getString("observacion")
                    );
                },
                idCita
        );
    }

    /* =========================================================
       CONSULTAS (portal del paciente)
    ========================================================= */

    @Transactional(readOnly = true)
    public List<CitaResponse> misCitas(String username) {
        Paciente paciente = pacienteDeUsuario(username);

        return jdbcTemplate.query(
                SELECT_CITA + " WHERE c.id_paciente = ? ORDER BY c.fecha_hora DESC",
                MAPEO_CITA,
                paciente.getIdPaciente()
        );
    }

    /* =========================================================
       DISPONIBILIDAD
    ========================================================= */

    /**
     * Horas de inicio posibles de un día (cada 30 minutos dentro del horario
     * del odontólogo en esa sucursal) y si cada una está libre.
     */
    @Transactional(readOnly = true)
    public DisponibilidadResponse disponibilidad(
            Integer idOdontologo,
            Integer idSucursal,
            LocalDate fecha,
            Integer idMotivo) {

        if (idOdontologo == null || idSucursal == null || fecha == null) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Indica odontólogo, sucursal y fecha.");
        }

        int duracion = duracionDe(buscarMotivoActivo(idMotivo));

        List<HorarioAtencion> horarios = horarioRepository
                .findByIdOdontologoAndDiaSemanaAndEstadoTrue(
                        idOdontologo,
                        fecha.getDayOfWeek().getValue()
                )
                .stream()
                .filter(h -> h.getIdSucursal().equals(idSucursal))
                .sorted((a, b) -> a.getHoraInicio().compareTo(b.getHoraInicio()))
                .toList();

        if (horarios.isEmpty()) {
            return new DisponibilidadResponse(fecha, duracion, false, List.of());
        }

        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = inicioDia.plusDays(1);

        List<Cita> ocupadas = citaRepository.ocupadasEnPeriodo(idOdontologo, inicioDia, finDia);
        List<BloqueoAgenda> bloqueos = bloqueoRepository.buscarCruces(
                idOdontologo, idSucursal, inicioDia, finDia
        );

        LocalDateTime ahora = LocalDateTime.now();
        List<DisponibilidadResponse.Bloque> bloques = new ArrayList<>();

        for (HorarioAtencion horario : horarios) {

            LocalDateTime inicio = fecha.atTime(redondearArriba(horario.getHoraInicio()));
            LocalDateTime limite = fecha.atTime(horario.getHoraFin());

            while (!inicio.plusMinutes(duracion).isAfter(limite)) {

                LocalDateTime fin = inicio.plusMinutes(duracion);
                LocalDateTime inicioBloque = inicio;

                boolean libre = inicio.isAfter(ahora)
                        && ocupadas.stream().noneMatch(c ->
                                c.getFechaHora().isBefore(fin)
                                        && c.getFechaHoraFin().isAfter(inicioBloque))
                        && bloqueos.stream().noneMatch(b ->
                                b.getFechaHoraInicio().isBefore(fin)
                                        && b.getFechaHoraFin().isAfter(inicioBloque));

                bloques.add(new DisponibilidadResponse.Bloque(
                        inicio.toLocalTime().toString(),
                        libre
                ));

                inicio = inicio.plusMinutes(INTERVALO_MINUTOS);
            }
        }

        return new DisponibilidadResponse(fecha, duracion, true, bloques);
    }

    /* =========================================================
       CREAR CITAS
    ========================================================= */

    /** Cita creada desde la agenda por recepción o administración. */
    @Transactional
    public CitaResponse crearDesdeGestion(CitaRequest request, String username) {

        if (request == null || request.idPaciente() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona el paciente.");
        }

        Usuario usuario = usuarioActual(username);

        Paciente paciente = pacienteRepository.findById(request.idPaciente())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "El paciente no existe."));

        validarPacienteActivo(paciente);

        Cita cita = registrar(
                paciente,
                request.idOdontologo(),
                request.idSucursal(),
                request.idMotivo(),
                request.fechaHora(),
                request.comentario(),
                usuario.getIdUsuario(),
                "Agendada por " + usuario.getNombres() + " " + usuario.getApellidos()
        );

        return buscarResponse(cita.getIdCita());
    }

    /** Reserva hecha por un paciente con sesión iniciada (portal). */
    @Transactional
    public CitaResponse reservarComoPaciente(
            String username,
            ReservaCitaPacienteRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos de la reserva.");
        }

        Paciente paciente = pacienteDeUsuario(username);
        validarPacienteActivo(paciente);

        Cita cita = registrar(
                paciente,
                request.idOdontologo(),
                request.idSucursal(),
                request.idMotivo(),
                request.fechaHora(),
                request.motivo(),
                paciente.getUsuario().getIdUsuario(),
                "Reservada por el paciente desde el portal"
        );

        return buscarResponse(cita.getIdCita());
    }

    /**
     * Reserva sin cuenta: se busca el paciente por RUT y, si no existe,
     * se crea con los datos ingresados. Si ya existe, se usan sus datos
     * registrados (no se sobrescriben).
     */
    @Transactional
    public CitaResponse reservarPublicamente(ReservaPublicaRequest request) {

        if (!RutValidator.esValido(request.rut())) {
            throw error(HttpStatus.BAD_REQUEST, "El RUT ingresado no es válido.");
        }

        if (request.fechaNacimiento() != null
                && request.fechaNacimiento().isAfter(LocalDate.now())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La fecha de nacimiento no puede ser futura.");
        }

        String rut = RutValidator.normalizar(request.rut());

        Paciente paciente = pacienteRepository.findByRut(rut)
                .orElseGet(() -> {
                    Paciente nuevo = new Paciente();
                    nuevo.setRut(rut);
                    nuevo.setNombres(request.nombres().trim());
                    nuevo.setApellidos(request.apellidos().trim());
                    nuevo.setFechaNacimiento(request.fechaNacimiento());
                    nuevo.setTelefono(textoOpcional(request.telefono()));
                    nuevo.setCorreo(request.correo() == null || request.correo().isBlank()
                            ? null
                            : request.correo().trim().toLowerCase());
                    nuevo.setEstado(1);
                    return pacienteRepository.save(nuevo);
                });

        validarPacienteActivo(paciente);

        Cita cita = registrar(
                paciente,
                request.idOdontologo(),
                request.idSucursal(),
                request.idMotivo(),
                request.fechaHora(),
                request.motivo(),
                null,
                "Reserva online sin cuenta"
        );

        return buscarResponse(cita.getIdCita());
    }

    /* =========================================================
       CAMBIOS DE ESTADO
    ========================================================= */

    @Transactional
    public CitaResponse cambiarEstado(
            Integer idCita,
            CambioEstadoCitaRequest request,
            String username) {

        if (request == null || request.estado() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Indica el nuevo estado.");
        }

        Usuario usuario = usuarioActual(username);
        Cita cita = obtenerCita(idCita);
        EstadoCita nuevo = leerEstado(request.estado());
        EstadoCita actual = cita.getEstado();

        if (usuario.getRol() == Rol.ODONTOLOGO) {
            if (!cita.getOdontologo().getIdUsuario().equals(usuario.getIdUsuario())) {
                throw error(HttpStatus.FORBIDDEN, "Esta cita pertenece a otro odontólogo.");
            }
            if (nuevo == EstadoCita.CANCELADA) {
                throw error(HttpStatus.FORBIDDEN,
                        "Las cancelaciones las gestiona recepción.");
            }
        }

        validarTransicion(actual, nuevo, cita.getFechaHora());

        cita.setEstado(nuevo);
        citaRepository.save(cita);

        registrarHistorial(
                idCita,
                usuario.getIdUsuario(),
                actual,
                nuevo,
                request.observacion()
        );

        return buscarResponse(idCita);
    }

    /** El paciente cancela una de sus citas futuras desde el portal. */
    @Transactional
    public CitaResponse cancelarComoPaciente(
            Integer idCita,
            String username,
            String observacion) {

        Paciente paciente = pacienteDeUsuario(username);
        Cita cita = obtenerCita(idCita);

        if (!cita.getPaciente().getIdPaciente().equals(paciente.getIdPaciente())) {
            throw error(HttpStatus.FORBIDDEN, "Esta cita no te pertenece.");
        }

        if (!cita.getFechaHora().isAfter(LocalDateTime.now())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Solo puedes cancelar citas que aún no ocurren.");
        }

        EstadoCita actual = cita.getEstado();
        validarTransicion(actual, EstadoCita.CANCELADA, cita.getFechaHora());

        cita.setEstado(EstadoCita.CANCELADA);
        citaRepository.save(cita);

        String texto = observacion == null || observacion.isBlank()
                ? "Cancelada por el paciente desde el portal"
                : "Cancelada por el paciente: " + observacion.trim();

        registrarHistorial(
                idCita,
                paciente.getUsuario().getIdUsuario(),
                actual,
                EstadoCita.CANCELADA,
                texto
        );

        return buscarResponse(idCita);
    }

    /** Cambia fecha/hora (y opcionalmente odontólogo o sucursal). Vuelve a RESERVADA. */
    @Transactional
    public CitaResponse reprogramar(
            Integer idCita,
            ReprogramarCitaRequest request,
            String username) {

        if (request == null || request.fechaHora() == null) {
            throw error(HttpStatus.BAD_REQUEST, "Indica la nueva fecha y hora.");
        }

        Usuario usuario = usuarioActual(username);
        Cita cita = obtenerCita(idCita);

        if (usuario.getRol() == Rol.ODONTOLOGO) {
            throw error(HttpStatus.FORBIDDEN, "La reprogramación la gestiona recepción.");
        }

        EstadoCita actual = cita.getEstado();

        if (actual != EstadoCita.RESERVADA && actual != EstadoCita.CONFIRMADA) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Solo se pueden reprogramar citas reservadas o confirmadas.");
        }

        Integer idOdontologo = request.idOdontologo() != null
                ? request.idOdontologo()
                : cita.getOdontologo().getIdUsuario();
        Integer idSucursal = request.idSucursal() != null
                ? request.idSucursal()
                : cita.getSucursal().getIdSucursal();

        bloquearOdontologo(idOdontologo);

        Odontologo odontologo = validarOdontologo(idOdontologo);
        Sucursal sucursal = validarSucursal(idSucursal, idOdontologo);

        int duracion = duracionDe(cita.getMotivoCita());
        LocalDateTime inicio = request.fechaHora().withSecond(0).withNano(0);
        LocalDateTime fin = inicio.plusMinutes(duracion);

        validarHorario(idOdontologo, idSucursal, inicio, fin, idCita);
        validarCrucePaciente(cita.getPaciente().getIdPaciente(), inicio, fin, idCita);

        String anterior = cita.getFechaHora().format(FORMATO_FECHA);

        cita.setOdontologo(odontologo);
        cita.setSucursal(sucursal);
        cita.setFechaHora(inicio);
        cita.setFechaHoraFin(fin);
        cita.setEstado(EstadoCita.RESERVADA);
        citaRepository.save(cita);

        String observacion = "Reprogramada desde el " + anterior;
        if (request.observacion() != null && !request.observacion().isBlank()) {
            observacion += ". " + request.observacion().trim();
        }

        registrarHistorial(idCita, usuario.getIdUsuario(), actual, EstadoCita.RESERVADA, observacion);

        return buscarResponse(idCita);
    }

    /* =========================================================
       REGISTRO Y VALIDACIONES
    ========================================================= */

    private Cita registrar(
            Paciente paciente,
            Integer idOdontologo,
            Integer idSucursal,
            Integer idMotivo,
            LocalDateTime fechaHora,
            String comentario,
            Integer idCreador,
            String observacionHistorial) {

        if (idOdontologo == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona el odontólogo.");
        }
        if (idSucursal == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona la sucursal.");
        }
        if (fechaHora == null) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona la fecha y la hora.");
        }

        String textoComentario = textoOpcional(comentario);
        if (textoComentario != null && textoComentario.length() > 255) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El comentario no puede superar 255 caracteres.");
        }

        // Evita que dos reservas simultáneas tomen la misma hora
        bloquearOdontologo(idOdontologo);

        Odontologo odontologo = validarOdontologo(idOdontologo);
        Sucursal sucursal = validarSucursal(idSucursal, idOdontologo);
        MotivoCita motivoCita = buscarMotivoActivo(idMotivo);

        LocalDateTime inicio = fechaHora.withSecond(0).withNano(0);
        LocalDateTime fin = inicio.plusMinutes(duracionDe(motivoCita));

        validarHorario(idOdontologo, idSucursal, inicio, fin, 0);
        validarCrucePaciente(paciente.getIdPaciente(), inicio, fin, 0);

        Cita cita = new Cita();
        cita.setPaciente(paciente);
        cita.setOdontologo(odontologo);
        cita.setSucursal(sucursal);
        cita.setMotivoCita(motivoCita);
        cita.setFechaHora(inicio);
        cita.setFechaHoraFin(fin);
        cita.setMotivo(textoComentario);
        cita.setEstado(EstadoCita.RESERVADA);
        cita.setIdUsuarioCreador(idCreador);

        Cita guardada = citaRepository.save(cita);

        registrarHistorial(
                guardada.getIdCita(),
                idCreador,
                null,
                EstadoCita.RESERVADA,
                observacionHistorial
        );

        return guardada;
    }

    /**
     * Comprueba que la hora sea futura, en :00 o :30, dentro del horario de
     * atención, fuera de bloqueos y sin cruce con otras citas del odontólogo.
     */
    private void validarHorario(
            Integer idOdontologo,
            Integer idSucursal,
            LocalDateTime inicio,
            LocalDateTime fin,
            Integer excluirCita) {

        if (!inicio.isAfter(LocalDateTime.now())) {
            throw error(HttpStatus.BAD_REQUEST, "La fecha de la cita debe ser futura.");
        }

        if (inicio.getMinute() % INTERVALO_MINUTOS != 0) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Las citas comienzan en horas completas o medias horas (ej: 10:00 o 10:30).");
        }

        if (!inicio.toLocalDate().equals(fin.minusNanos(1).toLocalDate())) {
            throw error(HttpStatus.BAD_REQUEST, "La cita debe terminar el mismo día.");
        }

        if (!horarioRepository.existsByIdOdontologoAndEstadoTrue(idOdontologo)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El odontólogo aún no tiene horario de atención configurado.");
        }

        LocalTime horaInicio = inicio.toLocalTime();
        LocalTime horaFin = fin.toLocalTime();
        if (horaFin.equals(LocalTime.MIDNIGHT)) {
            horaFin = LocalTime.MAX;
        }
        LocalTime finFinal = horaFin;

        boolean dentroDeHorario = horarioRepository
                .findByIdOdontologoAndDiaSemanaAndEstadoTrue(
                        idOdontologo,
                        inicio.getDayOfWeek().getValue()
                )
                .stream()
                .anyMatch(h -> h.getIdSucursal().equals(idSucursal)
                        && !horaInicio.isBefore(h.getHoraInicio())
                        && !finFinal.isAfter(h.getHoraFin()));

        if (!dentroDeHorario) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La hora seleccionada está fuera del horario de atención del odontólogo en esa sucursal.");
        }

        if (!bloqueoRepository.buscarCruces(idOdontologo, idSucursal, inicio, fin).isEmpty()) {
            throw error(HttpStatus.CONFLICT,
                    "El odontólogo no atiende en ese horario (agenda bloqueada).");
        }

        if (citaRepository.contarCrucesOdontologo(idOdontologo, inicio, fin, excluirCita) > 0) {
            throw error(HttpStatus.CONFLICT,
                    "El odontólogo ya tiene una cita en ese horario. Elige otra hora.");
        }
    }

    private void validarCrucePaciente(
            Integer idPaciente,
            LocalDateTime inicio,
            LocalDateTime fin,
            Integer excluirCita) {

        if (citaRepository.contarCrucesPaciente(idPaciente, inicio, fin, excluirCita) > 0) {
            throw error(HttpStatus.CONFLICT,
                    "El paciente ya tiene otra cita en ese horario.");
        }
    }

    private void validarTransicion(EstadoCita actual, EstadoCita nuevo, LocalDateTime fechaCita) {

        if (actual == nuevo) {
            throw error(HttpStatus.BAD_REQUEST, "La cita ya está en ese estado.");
        }

        Set<EstadoCita> finales = Set.of(
                EstadoCita.COMPLETADA,
                EstadoCita.CANCELADA,
                EstadoCita.NO_ASISTIO
        );

        if (finales.contains(actual)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La cita ya fue cerrada (" + etiqueta(actual) + ") y no se puede modificar.");
        }

        Map<EstadoCita, Set<EstadoCita>> permitidos = Map.of(
                EstadoCita.RESERVADA, Set.of(
                        EstadoCita.CONFIRMADA,
                        EstadoCita.CANCELADA,
                        EstadoCita.COMPLETADA,
                        EstadoCita.NO_ASISTIO
                ),
                EstadoCita.CONFIRMADA, Set.of(
                        EstadoCita.CANCELADA,
                        EstadoCita.COMPLETADA,
                        EstadoCita.NO_ASISTIO
                )
        );

        if (!permitidos.getOrDefault(actual, Set.of()).contains(nuevo)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "No se puede pasar de " + etiqueta(actual) + " a " + etiqueta(nuevo) + ".");
        }

        boolean yaOcurrio = !fechaCita.isAfter(LocalDateTime.now());

        if ((nuevo == EstadoCita.COMPLETADA || nuevo == EstadoCita.NO_ASISTIO) && !yaOcurrio) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Solo se puede marcar como " + etiqueta(nuevo)
                            + " una cita cuya hora ya comenzó.");
        }

        if (nuevo == EstadoCita.CONFIRMADA && yaOcurrio) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La cita ya comenzó: márcala como completada o no asistió.");
        }
    }

    private Odontologo validarOdontologo(Integer idOdontologo) {

        Odontologo odontologo = odontologoRepository.findById(idOdontologo)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "El odontólogo seleccionado no existe."));

        Integer estadoUsuario = odontologo.getUsuario() == null
                ? null
                : odontologo.getUsuario().getEstado();

        if (estadoUsuario == null || estadoUsuario != 1) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El odontólogo seleccionado no está disponible.");
        }

        return odontologo;
    }

    private Sucursal validarSucursal(Integer idSucursal, Integer idOdontologo) {

        Sucursal sucursal = sucursalRepository.findById(idSucursal)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "La sucursal seleccionada no existe."));

        if (!Boolean.TRUE.equals(sucursal.getEstado())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La sucursal seleccionada no está disponible.");
        }

        if (!odontologoSucursalRepository.existsByIdUsuarioAndIdSucursal(idOdontologo, idSucursal)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El odontólogo seleccionado no atiende en esa sucursal.");
        }

        return sucursal;
    }

    private void validarPacienteActivo(Paciente paciente) {
        if (paciente.getEstado() == null || paciente.getEstado() != 1) {
            throw error(HttpStatus.FORBIDDEN,
                    "El paciente está desactivado. Contacta a la clínica.");
        }
    }

    /** Bloquea la fila del odontólogo hasta terminar la transacción. */
    private void bloquearOdontologo(Integer idOdontologo) {
        jdbcTemplate.queryForList(
                "SELECT id_usuario FROM odontologo WHERE id_usuario = ? FOR UPDATE",
                idOdontologo
        );
    }

    private void registrarHistorial(
            Integer idCita,
            Integer idUsuario,
            EstadoCita anterior,
            EstadoCita nuevo,
            String observacion) {

        String texto = textoOpcional(observacion);
        if (texto != null && texto.length() > 250) {
            texto = texto.substring(0, 250);
        }

        jdbcTemplate.update(
                "INSERT INTO historial_cita "
                        + "(id_cita, id_usuario, estado_anterior, estado_nuevo, observacion) "
                        + "VALUES (?, ?, ?, ?, ?)",
                idCita,
                idUsuario,
                anterior == null ? null : anterior.name(),
                nuevo.name(),
                texto
        );
    }

    /* =========================================================
       UTILIDADES
    ========================================================= */

    /**
     * Busca el tipo de atención elegido. Si no se eligió ninguno, devuelve null
     * (es opcional). Si se eligió uno, debe existir y estar activo.
     */
    private MotivoCita buscarMotivoActivo(Integer idMotivo) {

        if (idMotivo == null) {
            return null;
        }

        MotivoCita motivoCita = motivoCitaRepository.findById(idMotivo)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "El tipo de atención seleccionado no existe."));

        if (!Boolean.TRUE.equals(motivoCita.getEstado())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El tipo de atención seleccionado no está disponible.");
        }

        return motivoCita;
    }

    private static int duracionDe(MotivoCita motivo) {
        if (motivo == null
                || motivo.getDuracionMinutos() == null
                || motivo.getDuracionMinutos() <= 0) {
            return Cita.DURACION_MINUTOS;
        }
        return motivo.getDuracionMinutos();
    }

    /** 09:10 -> 09:30; 09:00 -> 09:00 (las citas parten en :00 o :30). */
    private static LocalTime redondearArriba(LocalTime hora) {
        LocalTime base = hora.withSecond(0).withNano(0);
        int resto = base.getMinute() % INTERVALO_MINUTOS;
        if (resto == 0 && base.equals(hora)) {
            return base;
        }
        return base.plusMinutes(INTERVALO_MINUTOS - resto);
    }

    private CitaResponse buscarResponse(Integer idCita) {
        List<CitaResponse> resultado = jdbcTemplate.query(
                SELECT_CITA + " WHERE c.id_cita = ?",
                MAPEO_CITA,
                idCita
        );

        if (resultado.isEmpty()) {
            throw error(HttpStatus.NOT_FOUND, "La cita no existe.");
        }

        return resultado.get(0);
    }

    private Cita obtenerCita(Integer idCita) {
        return citaRepository.findById(idCita)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "La cita no existe."));
    }

    private Usuario usuarioActual(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
    }

    private Paciente pacienteDeUsuario(String username) {
        Usuario usuario = usuarioActual(username);
        return pacienteRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "Tu cuenta no está asociada a un paciente. Contacta a la clínica."));
    }

    private static EstadoCita leerEstado(String estado) {
        try {
            return EstadoCita.valueOf(estado.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw error(HttpStatus.BAD_REQUEST, "El estado indicado no existe.");
        }
    }

    private static String etiqueta(EstadoCita estado) {
        return switch (estado) {
            case RESERVADA -> "reservada";
            case CONFIRMADA -> "confirmada";
            case COMPLETADA -> "completada";
            case CANCELADA -> "cancelada";
            case NO_ASISTIO -> "no asistió";
        };
    }

    private static String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
