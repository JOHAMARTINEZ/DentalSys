package cl.dentalsys.model;

import java.io.Serializable;
import java.util.Objects;

public class OdontologoSucursalId implements Serializable {

    private Integer idUsuario;
    private Integer idSucursal;

    public OdontologoSucursalId() {
    }

    public OdontologoSucursalId(Integer idUsuario, Integer idSucursal) {
        this.idUsuario = idUsuario;
        this.idSucursal = idSucursal;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OdontologoSucursalId)) return false;
        OdontologoSucursalId that = (OdontologoSucursalId) o;
        return Objects.equals(idUsuario, that.idUsuario)
                && Objects.equals(idSucursal, that.idSucursal);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idUsuario, idSucursal);
    }
}