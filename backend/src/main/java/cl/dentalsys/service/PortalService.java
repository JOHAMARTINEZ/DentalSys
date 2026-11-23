package cl.dentalsys.service;

import cl.dentalsys.dto.AtencionResponse;
import cl.dentalsys.dto.CitaResponse;
import cl.dentalsys.dto.NotificacionesRequest;
import cl.dentalsys.dto.PendientePagoResponse;
import cl.dentalsys.dto.PerfilRequest;
import cl.dentalsys.dto.PerfilResponse;
import cl.dentalsys.dto.PortalResumenResponse;
import cl.dentalsys.dto.RegistroRequest;
import cl.dentalsys.model.Paciente;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.PacienteRepository;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Portal del paciente: resumen, atenciones, saldos, perfil, notificaciones
 * y registro de cuenta.
 */
@Service
public class PortalService {

    private static final String REGEX_CORREO = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
    private static final String REGEX_USERNAME = "^[a-zA-Z0-9._-]{3,50}$";

    private final UsuarioRepository usuarioRepository;
    private final PacienteRepository pacienteRepository;
    private final CitaService citaService;
    private final AtencionService atencionService;
    private final PagoService pagoService;
    private final PresupuestoService presupuestoService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public PortalService(
            UsuarioRepository usuarioRepository,
            PacienteRepository pacienteRepository,
            CitaService citaService,
            AtencionService atencionService,
            PagoService pagoService,
            PresupuestoService presupuestoService,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {

        this.usuarioRepository = usuarioRepository;
        this.pacienteRepository = pacienteRepository;
        this.citaService = citaService;
        this.atencionService = atencionService;
        this.pagoService = pagoService;
        this.presupuestoService = presupuestoService;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* =========================================================
       RESUMEN Y CONSULTAS
    ========================================================= */

    @Transactional
    public PortalResumenResponse resumen(String username) {

        Paciente paciente = pacienteDe(username);
        LocalDateTime ahora = LocalDateTime.now();

        List<CitaResponse> proximas = citaService.misCitas(username).stream()
                .filter(c -> c.fechaHora().isAfter(ahora))
                .filter(c -> "RESERVADA".equals(c.estado()) || "CONFIRMADA".equals(c.estado()))
                .sorted(Comparator.comparing(CitaResponse::fechaHora))
                .toList();

        long porResponder = presupuestoService.misPresupuestos(username).stream()
                .filter(p -> "PENDIENTE".equals(p.estado()))
                .count();

        BigDecimal saldo = pagoService.pendientes(paciente.getIdPaciente()).stream()
                .map(PendientePagoResponse::saldo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AtencionResponse> atenciones = atencionesCerradas(username);

        return new PortalResumenResponse(
                paciente.getNombres(),
                paciente.getApellidos(),
                proximas.isEmpty() ? null : proximas.get(0),
                proximas.size(),
                porResponder,
                saldo,
                atenciones.isEmpty() ? null : atenciones.get(0).fechaHora(),
                atenciones.size()
        );
    }

    /**
     * Atenciones CERRADAS del paciente. Las observaciones clínicas internas
     * no se envían al portal (el paciente ve diagnóstico, indicaciones y tratamientos).
     */
    @Transactional(readOnly = true)
    public List<AtencionResponse> atencionesCerradas(String username) {
        Paciente paciente = pacienteDe(username);
        return atencionService.listarPorPaciente(paciente.getIdPaciente()).stream()
                .filter(a -> "CERRADA".equals(a.estado()))
                .map(a -> new AtencionResponse(
                        a.idAtencion(), a.fechaHora(), a.estado(), a.diagnostico(), null,
                        a.indicaciones(), a.idCita(), a.fechaCita(), a.idPaciente(), a.pacienteNombre(),
                        a.idOdontologo(), a.odontologoNombre(), a.idSucursal(), a.sucursalNombre(),
                        a.total(), a.tratamientos()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PendientePagoResponse> pendientes(String username) {
        return pagoService.pendientes(pacienteDe(username).getIdPaciente());
    }

    /* =========================================================
       PERFIL
    ========================================================= */

    @Transactional(readOnly = true)
    public PerfilResponse perfil(String username) {

        Usuario usuario = usuarioDe(username);
        Paciente paciente = pacienteDe(username);

        List<Map<String, Object>> pref = jdbcTemplate.queryForList(
                "SELECT email_habilitado, whatsapp_habilitado, canal_preferido, "
                        + "fecha_consentimiento_email, fecha_consentimiento_whatsapp "
                        + "FROM preferencia_notificacion WHERE id_paciente = ?",
                paciente.getIdPaciente()
        );

        boolean email = false;
        boolean whatsapp = false;
        String canal = null;
        LocalDateTime consentimientoEmail = null;
        LocalDateTime consentimientoWsp = null;

        if (!pref.isEmpty()) {
            Map<String, Object> fila = pref.get(0);
            email = ((Number) fila.get("email_habilitado")).intValue() == 1;
            whatsapp = ((Number) fila.get("whatsapp_habilitado")).intValue() == 1;
            canal = (String) fila.get("canal_preferido");
            consentimientoEmail = aFecha(fila.get("fecha_consentimiento_email"));
            consentimientoWsp = aFecha(fila.get("fecha_consentimiento_whatsapp"));
        }

        return new PerfilResponse(
                RutValidator.formatear(paciente.getRut()),
                paciente.getNombres(),
                paciente.getApellidos(),
                paciente.getFechaNacimiento(),
                paciente.getTelefono(),
                paciente.getCorreo() != null ? paciente.getCorreo() : usuario.getCorreo(),
                paciente.getDireccion(),
                usuario.getUsername(),
                email,
                whatsapp,
                canal,
                consentimientoEmail,
                consentimientoWsp
        );
    }

    /** Actualiza teléfono, correo y dirección (el correo también en su cuenta). */
    @Transactional
    public PerfilResponse actualizarPerfil(String username, PerfilRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos.");
        }

        Usuario usuario = usuarioDe(username);
        Paciente paciente = pacienteDe(username);

        String correo = request.correo() == null ? "" : request.correo().trim().toLowerCase();
        if (correo.isEmpty() || !correo.matches(REGEX_CORREO) || correo.length() > 150) {
            throw error(HttpStatus.BAD_REQUEST, "Ingresa un correo válido.");
        }

        usuarioRepository.findByCorreo(correo)
                .filter(otro -> !otro.getIdUsuario().equals(usuario.getIdUsuario()))
                .ifPresent(otro -> {
                    throw error(HttpStatus.CONFLICT, "Ese correo ya está en uso por otra cuenta.");
                });

        String telefono = opcional(request.telefono(), 20, "El teléfono");
        String direccion = opcional(request.direccion(), 200, "La dirección");

        paciente.setTelefono(telefono);
        paciente.setCorreo(correo);
        paciente.setDireccion(direccion);
        pacienteRepository.save(paciente);

        usuario.setCorreo(correo);
        usuario.setTelefono(telefono);
        usuarioRepository.save(usuario);

        return perfil(username);
    }

    @Transactional
    public void cambiarClave(String username, String actual, String nueva) {

        Usuario usuario = usuarioDe(username);

        if (actual == null || !passwordEncoder.matches(actual, usuario.getPasswordHash())) {
            throw error(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta.");
        }
        if (nueva == null || nueva.length() < 8 || nueva.length() > 72) {
            throw error(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener entre 8 y 72 caracteres.");
        }

        usuario.setPasswordHash(passwordEncoder.encode(nueva));
        usuarioRepository.save(usuario);
    }

    /**
     * Guarda las preferencias. Al habilitar un canal se registra la fecha del
     * consentimiento (lo exigen los CHECK de preferencia_notificacion).
     */
    @Transactional
    public PerfilResponse guardarNotificaciones(String username, NotificacionesRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos.");
        }

        Paciente paciente = pacienteDe(username);

        String canal = request.canalPreferido() == null || request.canalPreferido().isBlank()
                ? null
                : request.canalPreferido().trim().toUpperCase();

        if (canal != null && !"EMAIL".equals(canal) && !"WHATSAPP".equals(canal)) {
            throw error(HttpStatus.BAD_REQUEST, "El canal preferido no es válido.");
        }
        if ("EMAIL".equals(canal) && !request.emailHabilitado()) {
            throw error(HttpStatus.BAD_REQUEST, "Para preferir el correo, habilítalo primero.");
        }
        if ("WHATSAPP".equals(canal) && !request.whatsappHabilitado()) {
            throw error(HttpStatus.BAD_REQUEST, "Para preferir WhatsApp, habilítalo primero.");
        }
        if (request.whatsappHabilitado()
                && (paciente.getTelefono() == null || paciente.getTelefono().isBlank())) {
            throw error(HttpStatus.BAD_REQUEST, "Agrega tu teléfono antes de habilitar WhatsApp.");
        }

        Timestamp ahora = Timestamp.valueOf(LocalDateTime.now().withNano(0));

        Integer existe = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM preferencia_notificacion WHERE id_paciente = ?",
                Integer.class, paciente.getIdPaciente());

        if (existe == null || existe == 0) {
            jdbcTemplate.update(
                    "INSERT INTO preferencia_notificacion (id_paciente, email_habilitado, whatsapp_habilitado, "
                            + "canal_preferido, fecha_consentimiento_email, fecha_consentimiento_whatsapp) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    paciente.getIdPaciente(),
                    request.emailHabilitado() ? 1 : 0,
                    request.whatsappHabilitado() ? 1 : 0,
                    canal,
                    request.emailHabilitado() ? ahora : null,
                    request.whatsappHabilitado() ? ahora : null
            );
        } else {
            // Si el canal se habilita y no tenía consentimiento, se registra ahora
            jdbcTemplate.update(
                    "UPDATE preferencia_notificacion SET "
                            + "email_habilitado = ?, whatsapp_habilitado = ?, canal_preferido = ?, "
                            + "fecha_consentimiento_email = CASE WHEN ? = 1 AND email_habilitado = 0 THEN ? "
                            + "ELSE fecha_consentimiento_email END, "
                            + "fecha_consentimiento_whatsapp = CASE WHEN ? = 1 AND whatsapp_habilitado = 0 THEN ? "
                            + "ELSE fecha_consentimiento_whatsapp END "
                            + "WHERE id_paciente = ?",
                    request.emailHabilitado() ? 1 : 0,
                    request.whatsappHabilitado() ? 1 : 0,
                    canal,
                    request.emailHabilitado() ? 1 : 0, ahora,
                    request.whatsappHabilitado() ? 1 : 0, ahora,
                    paciente.getIdPaciente()
            );
        }

        return perfil(username);
    }

    /* =========================================================
       REGISTRO DE CUENTA (público)
    ========================================================= */

    @Transactional
    public void registrar(RegistroRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del registro.");
        }

        if (request.rut() == null || !RutValidator.esValido(request.rut())) {
            throw error(HttpStatus.BAD_REQUEST, "El RUT ingresado no es válido.");
        }
        String rut = RutValidator.normalizar(request.rut());

        String nombres = obligatorio(request.nombres(), 100, "Los nombres");
        String apellidos = obligatorio(request.apellidos(), 100, "Los apellidos");

        LocalDate nacimiento = request.fechaNacimiento();
        if (nacimiento == null || nacimiento.isAfter(LocalDate.now())) {
            throw error(HttpStatus.BAD_REQUEST, "Ingresa una fecha de nacimiento válida.");
        }

        String correo = request.correo() == null ? "" : request.correo().trim().toLowerCase();
        if (!correo.matches(REGEX_CORREO) || correo.length() > 150) {
            throw error(HttpStatus.BAD_REQUEST, "Ingresa un correo válido.");
        }

        String username = request.username() == null ? "" : request.username().trim();
        if (!username.matches(REGEX_USERNAME)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El usuario debe tener entre 3 y 50 caracteres (letras, números, punto o guion).");
        }

        if (request.password() == null || request.password().length() < 8 || request.password().length() > 72) {
            throw error(HttpStatus.BAD_REQUEST, "La contraseña debe tener entre 8 y 72 caracteres.");
        }

        String telefono = opcional(request.telefono(), 20, "El teléfono");

        if (usuarioRepository.findByRut(rut).isPresent()) {
            throw error(HttpStatus.CONFLICT, "Ese RUT ya tiene una cuenta. Inicia sesión.");
        }
        if (usuarioRepository.findByCorreo(correo).isPresent()) {
            throw error(HttpStatus.CONFLICT, "Ese correo ya está en uso por otra cuenta.");
        }
        if (usuarioRepository.findByUsername(username).isPresent()) {
            throw error(HttpStatus.CONFLICT, "Ese nombre de usuario ya está en uso.");
        }

        Paciente existente = pacienteRepository.findByRut(rut).orElse(null);

        if (existente != null) {
            if (existente.getUsuario() != null) {
                throw error(HttpStatus.CONFLICT, "Ese RUT ya tiene una cuenta. Inicia sesión.");
            }
            if (!nacimiento.equals(existente.getFechaNacimiento())) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Los datos no coinciden con nuestros registros. Contacta a la clínica.");
            }
            if (existente.getEstado() == null || existente.getEstado() != 1) {
                throw error(HttpStatus.FORBIDDEN, "Tu ficha está desactivada. Contacta a la clínica.");
            }
        }

        Usuario usuario = new Usuario();
        usuario.setRut(rut);
        usuario.setNombres(existente != null ? existente.getNombres() : nombres);
        usuario.setApellidos(existente != null ? existente.getApellidos() : apellidos);
        usuario.setCorreo(correo);
        usuario.setTelefono(telefono);
        usuario.setUsername(username);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(Rol.PACIENTE);
        usuario.setEstado(1);
        Usuario guardado = usuarioRepository.save(usuario);

        jdbcTemplate.update(
                "INSERT INTO usuario_rol (id_usuario, id_rol) SELECT ?, id_rol FROM rol WHERE nombre = 'PACIENTE'",
                guardado.getIdUsuario()
        );

        Paciente paciente = existente != null ? existente : new Paciente();
        if (existente == null) {
            paciente.setRut(rut);
            paciente.setNombres(nombres);
            paciente.setApellidos(apellidos);
            paciente.setFechaNacimiento(nacimiento);
            paciente.setEstado(1);
        }
        if (paciente.getTelefono() == null) {
            paciente.setTelefono(telefono);
        }
        if (paciente.getCorreo() == null) {
            paciente.setCorreo(correo);
        }
        paciente.setUsuario(guardado);
        pacienteRepository.save(paciente);
    }

    /* =========================================================
       AUXILIARES
    ========================================================= */

    private Usuario usuarioDe(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Usuario no encontrado."));
    }

    private Paciente pacienteDe(String username) {
        Usuario usuario = usuarioDe(username);
        return pacienteRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "Tu cuenta no está asociada a un paciente. Contacta a la clínica."));
    }

    private static LocalDateTime aFecha(Object valor) {
        if (valor instanceof Timestamp t) {
            return t.toLocalDateTime();
        }
        if (valor instanceof LocalDateTime l) {
            return l;
        }
        return null;
    }

    private static String obligatorio(String valor, int maximo, String campo) {
        if (valor == null || valor.isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, campo + " son obligatorios.");
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw error(HttpStatus.BAD_REQUEST, campo + " no pueden superar " + maximo + " caracteres.");
        }
        return limpio;
    }

    private static String opcional(String valor, int maximo, String campo) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        if (limpio.length() > maximo) {
            throw error(HttpStatus.BAD_REQUEST, campo + " no puede superar " + maximo + " caracteres.");
        }
        return limpio;
    }

    private static ResponseStatusException error(HttpStatus status, String mensaje) {
        return new ResponseStatusException(status, mensaje);
    }
}
