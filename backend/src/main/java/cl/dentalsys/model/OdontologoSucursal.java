package cl.dentalsys.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "odontologo_sucursal")
@IdClass(OdontologoSucursalId.class)
public class OdontologoSucursal {

    @Id
    @Column(name = "id_usuario")
    private Integer idUsuario;

    @Id
    @Column(name = "id_sucursal")
    private Integer idSucursal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_usuario",
            insertable = false,
            updatable = false
    )
    private Odontologo odontologo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "id_sucursal",
            insertable = false,
            updatable = false
    )
    private Sucursal sucursal;

    public OdontologoSucursal() {
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Integer getIdSucursal() {
        return idSucursal;
    }

    public void setIdSucursal(Integer idSucursal) {
        this.idSucursal = idSucursal;
    }

    public Odontologo getOdontologo() {
        return odontologo;
    }

    public void setOdontologo(Odontologo odontologo) {
        this.odontologo = odontologo;
    }

    public Sucursal getSucursal() {
        return sucursal;
    }

    public void setSucursal(Sucursal sucursal) {
        this.sucursal = sucursal;
    }
}
