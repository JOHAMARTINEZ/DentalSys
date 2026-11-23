package cl.dentalsys.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Usuario tal como se muestra en la página de Usuarios.
 * No incluye la contraseña.
 */
public record UsuarioResponse(
        Integer idUsuario,
        String rut,
        String nombres,
        String apellidos,
        String correo,
        String telefono,
        String username,
        String rol,
        List<String> roles,
        boolean activo,
        LocalDateTime fechaCreacion,
        String especialidad,
        String numeroRegistroSalud,
        List<SucursalResumen> sucursales
) {

    public record SucursalResumen(
            Integer idSucursal,
            String nombre
    ) {
    }
}
