package cl.dentalsys.dto;

import java.util.List;

/**
 * Datos para crear o editar un usuario desde la página de Usuarios (ADMIN).
 * Las validaciones se hacen en UsuarioService para entregar mensajes claros.
 *
 * - password: obligatoria al crear; al editar se ignora
 *   (para cambiarla se usa PUT /api/usuarios/{id}/password).
 * - rol: solo se usa al crear (ADMIN, RECEPCIONISTA u ODONTOLOGO).
 * - especialidad, numeroRegistroSalud y sucursales: solo para ODONTOLOGO.
 */
public record UsuarioRequest(
        String rut,
        String nombres,
        String apellidos,
        String correo,
        String telefono,
        String username,
        String password,
        String rol,
        String especialidad,
        String numeroRegistroSalud,
        List<Integer> sucursales
) {
}
