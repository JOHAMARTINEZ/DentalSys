package cl.dentalsys.dto;

import java.util.List;

/**
 * Odontólogo activo, para listas de selección (público).
 * sucursales: ids de las sucursales donde atiende.
 */
public class OdontologoResponse {

    private final Integer idUsuario;
    private final String nombres;
    private final String apellidos;
    private final String especialidad;
    private final List<Integer> sucursales;

    public OdontologoResponse(
            Integer idUsuario,
            String nombres,
            String apellidos,
            String especialidad,
            List<Integer> sucursales
    ) {
        this.idUsuario = idUsuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.especialidad = especialidad;
        this.sucursales = sucursales;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getNombres() {
        return nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public List<Integer> getSucursales() {
        return sucursales;
    }
}
