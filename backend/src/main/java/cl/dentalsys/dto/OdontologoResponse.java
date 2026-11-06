package cl.dentalsys.dto;

public class OdontologoResponse {

    private Integer idUsuario;
    private String nombres;
    private String apellidos;
    private String especialidad;

    public OdontologoResponse(
            Integer idUsuario,
            String nombres,
            String apellidos,
            String especialidad
    ) {
        this.idUsuario = idUsuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.especialidad = especialidad;
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
}