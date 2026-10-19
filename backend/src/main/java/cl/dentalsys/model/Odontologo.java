package cl.dentalsys.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "odontologo")
public class Odontologo {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "especialidad", nullable = false, length = 100)
    private String especialidad;

    @Column(name = "numero_registro_salud", nullable = false, length = 50)
    private String numeroRegistroSalud;

    public Odontologo() {
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getEspecialidad() {
        return especialidad;
    }

    public void setEspecialidad(String especialidad) {
        this.especialidad = especialidad;
    }

    public String getNumeroRegistroSalud() {
        return numeroRegistroSalud;
    }

    public void setNumeroRegistroSalud(String numeroRegistroSalud) {
        this.numeroRegistroSalud = numeroRegistroSalud;
    }
}