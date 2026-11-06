package cl.dentalsys.repository;

import cl.dentalsys.model.OdontologoSucursal;
import cl.dentalsys.model.OdontologoSucursalId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OdontologoSucursalRepository
        extends JpaRepository<OdontologoSucursal, OdontologoSucursalId> {

    boolean existsByIdUsuarioAndIdSucursal(
            Integer idUsuario,
            Integer idSucursal
    );
}