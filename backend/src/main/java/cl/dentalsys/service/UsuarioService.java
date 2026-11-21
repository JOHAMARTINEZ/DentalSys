package cl.dentalsys.service;

import cl.dentalsys.dto.UsuarioRequest;
import cl.dentalsys.dto.UsuarioResponse;
import cl.dentalsys.model.Odontologo;
import cl.dentalsys.model.OdontologoSucursal;
import cl.dentalsys.model.Rol;
import cl.dentalsys.model.Sucursal;
import cl.dentalsys.model.Usuario;
import cl.dentalsys.repository.OdontologoRepository;
import cl.dentalsys.repository.OdontologoSucursalRepository;
import cl.dentalsys.repository.SucursalRepository;
import cl.dentalsys.repository.UsuarioRepository;
import cl.dentalsys.util.RutValidator;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Gestión de usuarios del sistema (solo ADMIN).
 *
 * Reglas:
 * - Desde aquí se crean usuarios del personal: ADMIN, RECEPCIONISTA y ODONTOLOGO.
 *   Las cuentas de PACIENTE se crean con el registro del portal.
 * - El rol se guarda en usuario.rol (campo legado que usa el login) y también
 *   en usuario_rol (multirol), para que ambos queden coherentes.
 * - Un ODONTOLOGO necesita especialidad, número de registro y al menos una
 *   sucursal (tablas odontologo y odontologo_sucursal).
 * - El rol no se cambia después de crear el usuario.
 * - No se puede desactivar el propio usuario ni el último ADMIN activo.
 */
@Service
public class UsuarioService {

    private static final Set<Rol> ROLES_CREABLES = Set.of(
            Rol.ADMIN,
            Rol.RECEPCIONISTA,
            Rol.ODONTOLOGO
    );

    private static final String REGEX_USERNAME = "^[a-zA-Z0-9._-]{3,50}$";
    private static final String REGEX_CORREO = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
    private static final int PASSWORD_MINIMO = 8;

    private final UsuarioRepository usuarioRepository;
    private final OdontologoRepository odontologoRepository;
    private final OdontologoSucursalRepository odontologoSucursalRepository;
    private final SucursalRepository sucursalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            OdontologoRepository odontologoRepository,
            OdontologoSucursalRepository odontologoSucursalRepository,
            SucursalRepository sucursalRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {

        this.usuarioRepository = usuarioRepository;
        this.odontologoRepository = odontologoRepository;
        this.odontologoSucursalRepository = odontologoSucursalRepository;
        this.sucursalRepository = sucursalRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    /* =========================================================
       CONSULTAS
    ========================================================= */

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {

        Map<Integer, Sucursal> sucursales = mapaSucursales();

        return usuarioRepository
                .findAllByOrderByNombresAscApellidosAsc()
                .stream()
                .map(usuario -> aResponse(usuario, sucursales))
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Integer idUsuario) {
        return aResponse(obtenerUsuario(idUsuario), mapaSucursales());
    }

    /* =========================================================
       CREAR
    ========================================================= */

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del usuario.");
        }

        Rol rol = leerRol(request.rol());

        if (!ROLES_CREABLES.contains(rol)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Desde aquí solo se pueden crear usuarios Administrador, "
                            + "Recepcionista u Odontólogo. Los pacientes crean su "
                            + "cuenta desde el portal.");
        }

        Usuario usuario = new Usuario();
        aplicarDatosBasicos(usuario, request, null);

        validarPassword(request.password());
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(rol);
        usuario.setEstado(1);

        Usuario guardado = usuarioRepository.save(usuario);

        // Multirol: se registra el mismo rol en usuario_rol
        jdbcTemplate.update(
                "INSERT INTO usuario_rol (id_usuario, id_rol) "
                        + "SELECT ?, id_rol FROM rol WHERE nombre = ?",
                guardado.getIdUsuario(),
                rol.name()
        );

        if (rol == Rol.ODONTOLOGO) {
            List<Integer> idsSucursales = validarDatosOdontologo(request, null);

            Odontologo odontologo = new Odontologo();
            odontologo.setUsuario(guardado);
            odontologo.setEspecialidad(request.especialidad().trim());
            odontologo.setNumeroRegistroSalud(
                    request.numeroRegistroSalud().trim()
            );
            odontologoRepository.save(odontologo);

            for (Integer idSucursal : idsSucursales) {
                agregarSucursal(guardado.getIdUsuario(), idSucursal);
            }
        }

        return aResponse(guardado, mapaSucursales());
    }

    /* =========================================================
       EDITAR
    ========================================================= */

    @Transactional
    public UsuarioResponse actualizar(Integer idUsuario, UsuarioRequest request) {

        if (request == null) {
            throw error(HttpStatus.BAD_REQUEST, "Faltan los datos del usuario.");
        }

        Usuario usuario = obtenerUsuario(idUsuario);

        // Un paciente con cuenta no puede cambiar su RUT desde aquí:
        // su ficha y sus citas están asociadas a ese RUT.
        if (usuario.getRol() == Rol.PACIENTE
                && request.rut() != null
                && !RutValidator.normalizar(request.rut().trim())
                .equals(usuario.getRut())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El RUT de una cuenta de paciente no se puede modificar.");
        }

        aplicarDatosBasicos(usuario, request, idUsuario);
        usuarioRepository.save(usuario);

        if (usuario.getRol() == Rol.ODONTOLOGO) {
            List<Integer> nuevas = validarDatosOdontologo(request, idUsuario);

            Odontologo odontologo = odontologoRepository.findById(idUsuario)
                    .orElseGet(() -> {
                        Odontologo nuevo = new Odontologo();
                        nuevo.setUsuario(usuario);
                        return nuevo;
                    });

            odontologo.setEspecialidad(request.especialidad().trim());
            odontologo.setNumeroRegistroSalud(
                    request.numeroRegistroSalud().trim()
            );
            odontologoRepository.save(odontologo);

            actualizarSucursales(idUsuario, nuevas);
        }

        return aResponse(usuario, mapaSucursales());
    }

    /* =========================================================
       CONTRASEÑA Y ESTADO
    ========================================================= */

    @Transactional
    public void cambiarPassword(Integer idUsuario, String password) {

        validarPassword(password);

        Usuario usuario = obtenerUsuario(idUsuario);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse cambiarEstado(
            Integer idUsuario,
            boolean activar,
            String usernameActual) {

        Usuario usuario = obtenerUsuario(idUsuario);

        if (!activar) {

            if (usuario.getUsername().equals(usernameActual)) {
                throw error(HttpStatus.BAD_REQUEST,
                        "No puedes desactivar tu propio usuario.");
            }

            if (usuario.getRol() == Rol.ADMIN
                    && usuario.getEstado() == 1
                    && usuarioRepository.countByRolAndEstado(Rol.ADMIN, 1) <= 1) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Debe quedar al menos un administrador activo.");
            }
        }

        usuario.setEstado(activar ? 1 : 0);
        usuarioRepository.save(usuario);

        // La tabla odontologo tiene su propio estado: se mantiene igual
        if (usuario.getRol() == Rol.ODONTOLOGO) {
            jdbcTemplate.update(
                    "UPDATE odontologo SET estado = ? WHERE id_usuario = ?",
                    activar ? 1 : 0,
                    idUsuario
            );
        }

        return aResponse(usuario, mapaSucursales());
    }

    /* =========================================================
       VALIDACIONES
    ========================================================= */

    /**
     * Valida y copia RUT, nombres, apellidos, correo, teléfono y usuario.
     * idActual = null al crear; al editar se excluye el propio usuario
     * de las validaciones de duplicados.
     */
    private void aplicarDatosBasicos(
            Usuario usuario,
            UsuarioRequest request,
            Integer idActual) {

        String rut = textoObligatorio(request.rut(), "El RUT es obligatorio.");

        if (!RutValidator.esValido(rut)) {
            throw error(HttpStatus.BAD_REQUEST, "El RUT ingresado no es válido.");
        }

        rut = RutValidator.normalizar(rut);

        String nombres = textoObligatorio(request.nombres(), "Los nombres son obligatorios.");
        String apellidos = textoObligatorio(request.apellidos(), "Los apellidos son obligatorios.");
        String correo = textoObligatorio(request.correo(), "El correo es obligatorio.")
                .toLowerCase();
        String username = textoObligatorio(request.username(), "El nombre de usuario es obligatorio.");
        String telefono = request.telefono() == null || request.telefono().isBlank()
                ? null
                : request.telefono().trim();

        validarLargo(nombres, 100, "Los nombres no pueden superar 100 caracteres.");
        validarLargo(apellidos, 100, "Los apellidos no pueden superar 100 caracteres.");
        validarLargo(correo, 150, "El correo no puede superar 150 caracteres.");

        if (telefono != null) {
            validarLargo(telefono, 20, "El teléfono no puede superar 20 caracteres.");
        }

        if (!correo.matches(REGEX_CORREO)) {
            throw error(HttpStatus.BAD_REQUEST, "El correo ingresado no es válido.");
        }

        if (!username.matches(REGEX_USERNAME)) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El nombre de usuario debe tener entre 3 y 50 caracteres "
                            + "(letras, números, punto, guion o guion bajo).");
        }

        usuarioRepository.findByRut(rut)
                .filter(otro -> !otro.getIdUsuario().equals(idActual))
                .ifPresent(otro -> {
                    throw error(HttpStatus.CONFLICT,
                            "Ya existe un usuario con ese RUT.");
                });

        usuarioRepository.findByCorreo(correo)
                .filter(otro -> !otro.getIdUsuario().equals(idActual))
                .ifPresent(otro -> {
                    throw error(HttpStatus.CONFLICT,
                            "Ya existe un usuario con ese correo.");
                });

        usuarioRepository.findByUsername(username)
                .filter(otro -> !otro.getIdUsuario().equals(idActual))
                .ifPresent(otro -> {
                    throw error(HttpStatus.CONFLICT,
                            "Ese nombre de usuario ya está en uso.");
                });

        usuario.setRut(rut);
        usuario.setNombres(nombres);
        usuario.setApellidos(apellidos);
        usuario.setCorreo(correo);
        usuario.setTelefono(telefono);
        usuario.setUsername(username);
    }

    /**
     * Valida especialidad, número de registro y sucursales de un odontólogo.
     * Devuelve los ids de sucursal sin repetidos.
     */
    private List<Integer> validarDatosOdontologo(
            UsuarioRequest request,
            Integer idActual) {

        String especialidad = textoObligatorio(
                request.especialidad(),
                "La especialidad es obligatoria para un odontólogo."
        );
        String registro = textoObligatorio(
                request.numeroRegistroSalud(),
                "El número de registro en Superintendencia de Salud es obligatorio."
        );

        validarLargo(especialidad, 100, "La especialidad no puede superar 100 caracteres.");
        validarLargo(registro, 50, "El número de registro no puede superar 50 caracteres.");

        Integer repetidos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM odontologo "
                        + "WHERE numero_registro_salud = ? AND id_usuario <> ?",
                Integer.class,
                registro,
                idActual == null ? 0 : idActual
        );

        if (repetidos != null && repetidos > 0) {
            throw error(HttpStatus.CONFLICT,
                    "Ya existe un odontólogo con ese número de registro.");
        }

        if (request.sucursales() == null || request.sucursales().isEmpty()) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Selecciona al menos una sucursal donde atiende el odontólogo.");
        }

        List<Integer> ids = new ArrayList<>(new LinkedHashSet<>(request.sucursales()));

        for (Integer idSucursal : ids) {
            Sucursal sucursal = sucursalRepository.findById(idSucursal)
                    .orElseThrow(() -> error(HttpStatus.BAD_REQUEST,
                            "Una de las sucursales seleccionadas no existe."));

            if (!Boolean.TRUE.equals(sucursal.getEstado())) {
                throw error(HttpStatus.BAD_REQUEST,
                        "La sucursal \"" + sucursal.getNombre() + "\" no está activa.");
            }
        }

        return ids;
    }

    /**
     * Deja al odontólogo asignado exactamente a las sucursales indicadas.
     * No permite quitar una sucursal que ya tiene citas, horarios,
     * bloqueos, atenciones o presupuestos (la base lo impediría igual).
     */
    private void actualizarSucursales(Integer idUsuario, List<Integer> nuevas) {

        List<OdontologoSucursal> actuales =
                odontologoSucursalRepository.findByIdUsuario(idUsuario);

        Set<Integer> idsActuales = actuales.stream()
                .map(OdontologoSucursal::getIdSucursal)
                .collect(Collectors.toSet());

        for (OdontologoSucursal asignacion : actuales) {

            Integer idSucursal = asignacion.getIdSucursal();

            if (nuevas.contains(idSucursal)) {
                continue;
            }

            Integer usos = jdbcTemplate.queryForObject(
                    "SELECT "
                            + "(SELECT COUNT(*) FROM cita WHERE id_odontologo = ? AND id_sucursal = ?) + "
                            + "(SELECT COUNT(*) FROM horario_atencion WHERE id_usuario = ? AND id_sucursal = ?) + "
                            + "(SELECT COUNT(*) FROM bloqueo_agenda WHERE id_usuario = ? AND id_sucursal = ?) + "
                            + "(SELECT COUNT(*) FROM atencion WHERE id_odontologo = ? AND id_sucursal = ?) + "
                            + "(SELECT COUNT(*) FROM presupuesto WHERE id_odontologo = ? AND id_sucursal = ?)",
                    Integer.class,
                    idUsuario, idSucursal,
                    idUsuario, idSucursal,
                    idUsuario, idSucursal,
                    idUsuario, idSucursal,
                    idUsuario, idSucursal
            );

            if (usos != null && usos > 0) {
                String nombre = sucursalRepository.findById(idSucursal)
                        .map(Sucursal::getNombre)
                        .orElse("seleccionada");

                throw error(HttpStatus.CONFLICT,
                        "No se puede quitar la sucursal \"" + nombre
                                + "\": el odontólogo ya tiene citas, horarios, "
                                + "atenciones o presupuestos en ella.");
            }

            odontologoSucursalRepository.delete(asignacion);
        }

        for (Integer idSucursal : nuevas) {
            if (!idsActuales.contains(idSucursal)) {
                agregarSucursal(idUsuario, idSucursal);
            }
        }
    }

    private void agregarSucursal(Integer idUsuario, Integer idSucursal) {
        OdontologoSucursal asignacion = new OdontologoSucursal();
        asignacion.setIdUsuario(idUsuario);
        asignacion.setIdSucursal(idSucursal);
        odontologoSucursalRepository.save(asignacion);
    }

    private void validarPassword(String password) {

        if (password == null || password.length() < PASSWORD_MINIMO) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener al menos "
                            + PASSWORD_MINIMO + " caracteres.");
        }

        if (password.length() > 72) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La contraseña no puede superar 72 caracteres.");
        }
    }

    private Rol leerRol(String rol) {

        if (rol == null || rol.isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, "Selecciona un rol.");
        }

        try {
            return Rol.valueOf(rol.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw error(HttpStatus.BAD_REQUEST, "El rol seleccionado no existe.");
        }
    }

    /* =========================================================
       CONVERSIÓN A RESPUESTA
    ========================================================= */

    private UsuarioResponse aResponse(
            Usuario usuario,
            Map<Integer, Sucursal> sucursales) {

        List<String> roles = jdbcTemplate.queryForList(
                "SELECT r.nombre FROM usuario_rol ur "
                        + "JOIN rol r ON r.id_rol = ur.id_rol "
                        + "WHERE ur.id_usuario = ? ORDER BY r.nombre",
                String.class,
                usuario.getIdUsuario()
        );

        String especialidad = null;
        String registro = null;
        List<UsuarioResponse.SucursalResumen> listaSucursales = List.of();

        if (usuario.getRol() == Rol.ODONTOLOGO) {

            Odontologo odontologo = odontologoRepository
                    .findById(usuario.getIdUsuario())
                    .orElse(null);

            if (odontologo != null) {
                especialidad = odontologo.getEspecialidad();
                registro = odontologo.getNumeroRegistroSalud();
            }

            listaSucursales = odontologoSucursalRepository
                    .findByIdUsuario(usuario.getIdUsuario())
                    .stream()
                    .map(asignacion -> {
                        Sucursal sucursal = sucursales.get(asignacion.getIdSucursal());
                        return new UsuarioResponse.SucursalResumen(
                                asignacion.getIdSucursal(),
                                sucursal != null ? sucursal.getNombre() : "Sucursal"
                        );
                    })
                    .sorted(Comparator.comparing(UsuarioResponse.SucursalResumen::nombre))
                    .toList();
        }

        return new UsuarioResponse(
                usuario.getIdUsuario(),
                RutValidator.formatear(usuario.getRut()),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getTelefono(),
                usuario.getUsername(),
                usuario.getRol().name(),
                roles,
                usuario.getEstado() != null && usuario.getEstado() == 1,
                usuario.getFechaCreacion(),
                especialidad,
                registro,
                listaSucursales
        );
    }

    /* =========================================================
       UTILIDADES
    ========================================================= */

    private Map<Integer, Sucursal> mapaSucursales() {
        return sucursalRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Sucursal::getIdSucursal, Function.identity()));
    }

    private Usuario obtenerUsuario(Integer idUsuario) {
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "El usuario no existe."));
    }

    private static String textoObligatorio(String valor, String mensaje) {

        if (valor == null || valor.isBlank()) {
            throw error(HttpStatus.BAD_REQUEST, mensaje);
        }

        return valor.trim();
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
